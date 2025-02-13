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

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

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

  const handleSignInRedirect = () => {
    const returnUrl = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    router.push(`/sign-in?redirect_url=${returnUrl}`);
  };
  const handlePageClick = (page: number) => {
    if (page >= 0 && page <= maxPage) {
      onPageChange(page);
    }
  };

  const handleDisabledClick = () => {
    if (isDisabled) return;
  };

  return (
    <>
      {isSignedIn ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href='#'
                onClick={() => currentPage > 0 && onPageChange(currentPage - 1)}
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {displayPage > 2 && (
              <PaginationItem>
                <PaginationLink href='#' onClick={() => handlePageClick(0)}>
                  1
                </PaginationLink>
              </PaginationItem>
            )}

            {displayPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {displayPage > 1 && (
              <PaginationItem>
                <PaginationLink
                  href='#'
                  onClick={() => handlePageClick(displayPage - 2)}
                >
                  {displayPage - 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationLink
                href='#'
                isActive
                onClick={() => handlePageClick(displayPage - 1)}
                className='bg-neutral-600'
              >
                {displayPage}
              </PaginationLink>
            </PaginationItem>

            {displayPage < maxPage + 1 && (
              <PaginationItem>
                <PaginationLink
                  href='#'
                  onClick={() => handlePageClick(displayPage)}
                >
                  {displayPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            {displayPage < maxPage && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {displayPage < maxPage && (
              <PaginationItem>
                <PaginationLink
                  href='#'
                  onClick={() => handlePageClick(maxPage)}
                >
                  {maxPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}

            <PaginationItem>
              <PaginationNext
                href='#'
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
            <PaginationItem>
              <PaginationPrevious
                href='#'
                className={
                  currentPage === 0
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href='#'
                isActive
                onClick={(e) => {
                  e.preventDefault();
                  handleDisabledClick();
                }}
              >
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  handleSignInRedirect();
                }}
              >
                2
              </PaginationLink>
            </PaginationItem>

            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            {displayPage < maxPage - 1 && (
              <PaginationItem>
                <PaginationLink
                  href='#'
                  onClick={(e) => {
                    e.preventDefault();
                    handleSignInRedirect();
                  }}
                >
                  {maxPage + 1}
                </PaginationLink>
              </PaginationItem>
            )}
            <PaginationItem>
              <PaginationNext
                href='#'
                onClick={(e) => {
                  e.preventDefault();
                  handleSignInRedirect();
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
      {!isSignedIn && (
        <div className='text-center mt-4 text-muted-foreground text-sm'>
          Please{" "}
          <Link
            href={`/sign-in?redirect_url=${encodeURIComponent(
              window.location.pathname + window.location.search
            )}`}
            className='text-primary hover:underline'
          >
            sign in
          </Link>{" "}
          to view more results
        </div>
      )}
    </>
  );
};
