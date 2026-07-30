"use client";

import { createContext, useContext } from "react";

export type MenuNode = {
  id: string;
  label: string;
  href?: string;
  subItems?: MenuNode[];
};

const MenuContext = createContext<MenuNode[]>([]);

type MenuProviderProps = {
  menu: MenuNode[];
  children: React.ReactNode;
};

export function MenuProvider({ menu, children }: MenuProviderProps) {
  return <MenuContext.Provider value={menu}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  return useContext(MenuContext);
}
