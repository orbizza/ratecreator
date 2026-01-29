/**
 * Tests for Consumer Build Configuration
 * Ensures build scripts don't cause race conditions during parallel builds
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const CONSUMERS_DIR = path.join(__dirname, "..");

// Get all consumer directories
function getConsumerDirectories(): string[] {
  const entries = fs.readdirSync(CONSUMERS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("__"))
    .map((entry) => entry.name);
}

describe("Consumer Build Configuration", () => {
  const consumers = getConsumerDirectories();

  describe("Package.json build scripts", () => {
    it.each(consumers)("%s should have a valid package.json", (consumer) => {
      const packageJsonPath = path.join(
        CONSUMERS_DIR,
        consumer,
        "package.json",
      );
      expect(fs.existsSync(packageJsonPath)).toBe(true);

      const content = fs.readFileSync(packageJsonPath, "utf-8");
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it.each(consumers)(
      "%s build script should NOT include prisma-generate (prevents race conditions)",
      (consumer) => {
        const packageJsonPath = path.join(
          CONSUMERS_DIR,
          consumer,
          "package.json",
        );
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const buildScript = packageJson.scripts?.build || "";

        // Build script should NOT contain prisma-generate
        // This prevents race conditions when turbo runs parallel builds
        expect(buildScript).not.toContain("prisma-generate");
        expect(buildScript).not.toContain("prisma generate");
      },
    );

    it.each(consumers)("%s should have esbuild in build script", (consumer) => {
      const packageJsonPath = path.join(
        CONSUMERS_DIR,
        consumer,
        "package.json",
      );
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      const buildScript = packageJson.scripts?.build || "";

      // Should use esbuild for bundling
      expect(buildScript).toContain("build-");
    });

    it.each(consumers)(
      "%s should have @ratecreator/db dependency",
      (consumer) => {
        const packageJsonPath = path.join(
          CONSUMERS_DIR,
          consumer,
          "package.json",
        );
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const deps = packageJson.dependencies || {};

        // All consumers need the db package for Prisma client
        expect(deps["@ratecreator/db"]).toBeDefined();
      },
    );
  });

  describe("Required dependencies", () => {
    it.each(consumers)("%s should have kafkajs dependency", (consumer) => {
      const packageJsonPath = path.join(
        CONSUMERS_DIR,
        consumer,
        "package.json",
      );
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

      const deps = packageJson.dependencies || {};

      // All consumers need Kafka
      expect(deps["kafkajs"]).toBeDefined();
    });

    it.each(consumers)(
      "%s should have hono dependency for health checks",
      (consumer) => {
        const packageJsonPath = path.join(
          CONSUMERS_DIR,
          consumer,
          "package.json",
        );
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );

        const deps = packageJson.dependencies || {};

        // All consumers use Hono for health endpoints
        expect(deps["hono"]).toBeDefined();
      },
    );
  });

  describe("Source files", () => {
    it.each(consumers)(
      "%s should have src/index.ts entry point",
      (consumer) => {
        const indexPath = path.join(CONSUMERS_DIR, consumer, "src", "index.ts");
        expect(fs.existsSync(indexPath)).toBe(true);
      },
    );
  });

  describe("Parallel build safety", () => {
    it("no two consumers should have prisma-generate in build script", () => {
      const consumersWithPrismaGenerate: string[] = [];

      for (const consumer of consumers) {
        const packageJsonPath = path.join(
          CONSUMERS_DIR,
          consumer,
          "package.json",
        );
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8"),
        );
        const buildScript = packageJson.scripts?.build || "";

        if (
          buildScript.includes("prisma-generate") ||
          buildScript.includes("prisma generate")
        ) {
          consumersWithPrismaGenerate.push(consumer);
        }
      }

      // If multiple consumers have prisma-generate, parallel builds will fail
      expect(consumersWithPrismaGenerate).toHaveLength(0);
    });

    it("root package.json should run prisma-generate before turbo build", async () => {
      const rootPackageJsonPath = path.join(
        CONSUMERS_DIR,
        "..",
        "..",
        "package.json",
      );
      const packageJson = JSON.parse(
        fs.readFileSync(rootPackageJsonPath, "utf-8"),
      );
      const buildScript = packageJson.scripts?.build || "";

      // Root build should generate Prisma client before parallel consumer builds
      expect(buildScript).toContain("prisma-generate");
      expect(buildScript).toContain("turbo build");

      // prisma-generate should come before turbo build
      const prismaIndex = buildScript.indexOf("prisma-generate");
      const turboIndex = buildScript.indexOf("turbo build");
      expect(prismaIndex).toBeLessThan(turboIndex);
    });
  });
});
