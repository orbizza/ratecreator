import React from "react";

interface KbdProps {
  children: React.ReactNode;
}

const Kbd: React.FC<KbdProps> = ({ children }) => {
  return (
    <span className='inline-block px-2 py-1 bg-gray-200 text-sm font-mono rounded shadow text-gray-900'>
      {children}
    </span>
  );
};

export default Kbd;
