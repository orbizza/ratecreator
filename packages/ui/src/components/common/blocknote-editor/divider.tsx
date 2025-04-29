"use client";

import React from "react";

import { createReactBlockSpec } from "@blocknote/react";

/**
 * Divider Component for BlockNote
 *
 * This component creates a horizontal divider block in the BlockNote editor.
 * It provides a visual separation between different sections of content.
 * The divider is styled to be theme-aware and responsive.
 */

export const Divider = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {},
    content: "none",
  },
  {
    render: () => {
      return (
        <div className='p-2 w-full'>
          <hr className='border-t border-neutral-200 mx-0 my-0' />
        </div>
      );
    },
  }
);
