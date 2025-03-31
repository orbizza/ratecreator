"use client";

import React from "react";

import { createReactBlockSpec } from "@blocknote/react";

export const Divider = createReactBlockSpec(
  {
    type: "divider",
    propSchema: {},
    content: "none",
  },
  {
    render: () => {
      return (
        <div className="p-2 w-full">
          <hr className="border-t border-neutral-200 mx-0 my-0" />
        </div>
      );
    },
  },
);
