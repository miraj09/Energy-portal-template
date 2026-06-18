"use client";

import { createContext, useContext } from "react";

type MenuNode = {
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
