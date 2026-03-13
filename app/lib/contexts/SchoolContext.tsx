"use client";
import { createContext, useContext } from "react";

export interface SchoolInfo {
  name: string;
  subdomain: string;
  logo_url: string;
}

const defaultSchool: SchoolInfo = {
  name: "Campus Virtual",
  subdomain: "",
  logo_url: "/images/logos/campus-virtual.png",
};

export const SchoolContext = createContext<SchoolInfo>(defaultSchool);

export function SchoolProvider({
  school,
  children,
}: {
  school: SchoolInfo;
  children: React.ReactNode;
}) {
  return (
    <SchoolContext.Provider value={school}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool(): SchoolInfo {
  return useContext(SchoolContext);
}
