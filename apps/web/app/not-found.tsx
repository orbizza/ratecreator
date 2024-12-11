"use client";

import React from "react";
import { ErrorMessage } from "@ratecreator/ui/review";

const Custom404: React.FC = () => {
  return <ErrorMessage code={404} />;
};

export default Custom404;
