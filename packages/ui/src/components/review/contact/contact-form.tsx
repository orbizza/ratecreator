"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
  Button,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from "@ratecreator/ui";
import { ContactSchema } from "@ratecreator/types/review";
import { contact } from "@ratecreator/actions/review";
import { FormError } from "../common/form-error";
import { FormSuccess } from "../common/form-success";

/**
 * ContactForm Component
 *
 * A form component for collecting user contact information and messages.
 * Features include:
 * - Form validation using Zod schema
 * - Real-time error handling
 * - Success/error message display
 * - Responsive design
 * - Privacy policy and terms links
 *
 * @component
 * @returns {JSX.Element} A contact form with validation and submission handling
 */
export const ContactForm = () => {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");

  /**
   * Form configuration using react-hook-form with Zod validation
   */
  const form = useForm<z.infer<typeof ContactSchema>>({
    resolver: zodResolver(ContactSchema),
    defaultValues: {
      email: "",
      name: "",
      message: "",
    },
  });

  /**
   * Handles form submission
   * - Clears previous error/success messages
   * - Submits form data to the server
   * - Updates error/success state based on response
   *
   * @param {z.infer<typeof ContactSchema>} values - The validated form data
   */
  const onSubmit = (values: z.infer<typeof ContactSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      contact(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };

  return (
    <Card className="flex flex-col  w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl justify-center items-center">
          Let&apos;s Talk
        </CardTitle>
        <CardDescription>
          Fill the details to be part of our journey and we&apos;ll get back to
          you as soon as possible.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-0 px-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="john.doe@example.com"
                      type="email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[100px]"
                      id="message"
                      disabled={isPending}
                      placeholder="Enter your message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="mx-auto pl-4 pr-4">
            <FormError message={error} />
            <FormSuccess message={success} />
          </div>
          <small className="text-center p-1 block text-gray-500">
            By submitting the form, you confirm that you agree to the processing
            of your personal data by Orbizza, Inc as described in the
            <a href="/privacy"> Privacy Statement</a> and our{" "}
            <a href="/terms">Terms of Use</a>.
          </small>
          <CardFooter>
            <Button disabled={isPending} type="submit" className="w-full">
              Send message
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
