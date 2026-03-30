'use client';

import { createContext, useContext, type ReactNode } from 'react';

const CourseBrowseContext = createContext<{ courseLinkBase: string }>({
  courseLinkBase: '/courses',
});

export function CourseBrowseProvider({
  courseLinkBase,
  children,
}: {
  courseLinkBase: string;
  children: ReactNode;
}) {
  const base = courseLinkBase.replace(/\/$/, '') || '/courses';
  return (
    <CourseBrowseContext.Provider value={{ courseLinkBase: base }}>{children}</CourseBrowseContext.Provider>
  );
}

export function useCourseBrowseBase() {
  return useContext(CourseBrowseContext);
}
