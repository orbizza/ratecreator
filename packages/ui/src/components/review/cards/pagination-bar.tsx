"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ratecreator/ui";

/**
 * Props for the PaginationBar component
 */
interface PaginationBarProps {
  /** Current page number (0-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback function when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items */
  totalItems: number;
  /** Number of items per page */
  itemsPerPage: number;
}

/**
 * PaginationBar Component
 *
 * A pagination component that displays page navigation controls.
 * Shows page numbers, previous/next buttons, and ellipsis for large page ranges.
 * Handles both signed-in and signed-out user states with appropriate UI and behavior.
 *
 * @component
 * @param {PaginationBarProps} props - Component props
 * @returns {JSX.Element} A pagination bar component
 */
export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const maxPage = Math.min(49, totalPages - 1);
  const displayPage = currentPage + 1;
  const isDisabled = true;

  /**
   * Handles redirect to sign-in page while preserving the current URL
   */
  const handleSignInRedirect = () => {
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search,
    );
    router.push(`/sign-in?redirect_url=${returnUrl}`);
  };

  /**
   * Handles page click events
   * @param {number} page - The page number to navigate to
   */
  const handlePageClick = (page: number) => {
    if (page >= 0 && page <= maxPage) {
      onPageChange(page);
    }
  };

  /**
   * Handles click events on disabled pagination items
   */
  const handleDisabledClick = () => {
    if (isDisabled) return;
  };

  return (
    <>
      {isSignedIn ? (
        <Pagination>
          <PaginationContent>
            {/* Previous page button */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* First page link */}
            {displayPage > 2 && (
              <PaginationItem>
                <PaginationLink href="#" onClick={() => handlePageClick(0)}>
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {/* First ellipsis */}
            {displayPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Previous page link */}
            {displayPage > 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageClick(displayPage - 2)}
                >
                  {displayPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Current page link */}
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={() => handlePageClick(displayPage - 1)}
                className="bg-neutral-600"
              >
                {displayPage}
              </PaginationLink>
            </PaginationItem>

            {/* Next page link */}
            {displayPage < maxPage + 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageClick(displayPage)}
                >
                  {displayPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Second ellipsis */}
            {displayPage < maxPage && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Last page link */}
            {displayPage < maxPage && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageClick(maxPage)}
                >
                  {maxPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Next page button */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() =>
                  currentPage < maxPage && onPageChange(currentPage + 1)
                }
                className={
                  currentPage === maxPage
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : (
        <Pagination>
          <PaginationContent>
            {/* Previous page button (disabled for non-signed-in users) */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Current page link */}
            <PaginationItem>
              <PaginationLink
                href="#"
                isActive
                onClick={(e) => {
                  e.preventDefault();
                  handleDisabledClick();
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>

            {/* Next page link (requires sign-in) */}
            <PaginationItem>
              <PaginationLink
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignInRedirect();
                }}
              >
                2
              </PaginationLink>
            </PaginationItem>

            {/* Ellipsis for non-signed-in users */}
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>

            {/* Last page link (requires sign-in) */}
            {displayPage < maxPage - 1 && (
              <PaginationItem>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSignInRedirect();
                  }}
                >
                  {maxPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Next page button (requires sign-in) */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleSignInRedirect();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Sign-in prompt for non-signed-in users */}
      {!isSignedIn && (
        <div className="text-center mt-4 text-muted-foreground text-sm">
          Please{" "}
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(
              window.location.pathname + window.location.search,
            )}`}
            className="text-primary hover:underline"
          >
            sign in
          </Link>{" "}
          to view more results
        </div>
      )}
    </>
  );
};
