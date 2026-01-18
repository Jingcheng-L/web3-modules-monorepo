"use client";

import React, { useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { hardhat } from "viem/chains";
import { Bars3Icon, BugAntIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { FaucetButton, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick, useTargetNetwork } from "~~/hooks/scaffold-eth";

type HeaderMenuLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  children?: HeaderMenuLink[];
};

export const menuLinks: HeaderMenuLink[] = [
  {
    label: "About",
    href: "/",
  },
  {
    label: "Token",
    href: "/token",
    children: [
      {
        label: "Wallet",
        href: "/token/wallet",
      },
    ],
  },
  {
    label: "Vesting",
    href: "vesting",
    children: [
      {
        label: "Plans",
        href: "/vesting/plans",
      },
      {
        label: "Dashboard",
        href: "/vesting/dashboard",
      },
    ],
  },
  {
    label: "Staking",
    href: "/staking",
  },
  {
    label: "AuctionETH",
    href: "/auction-eth",
    children: [
      {
        label: "List",
        href: "/auction-eth",
      },
      {
        label: "Create",
        href: "/auction-eth/create",
      },
    ],
  },
  {
    label: "Debug Contracts",
    href: "/debug",
    icon: <BugAntIcon className="h-4 w-4" />,
  },
];

// 定义 props 类型，接收关闭菜单的回调
interface HeaderMenuLinksProps {
  closeMenu?: () => void;
}

export const HeaderMenuLinks = ({ closeMenu }: HeaderMenuLinksProps) => {
  const pathname = usePathname();

  return (
    <>
      {menuLinks.map(({ label, href, icon, children }) => {
        const isActive = pathname === href || children?.some(child => pathname === child.href);

        const commonClass =
          "flex items-center gap-2 px-3 py-1.5 text-sm rounded-full transition-all duration-200 cursor-pointer select-none border border-transparent focus:outline-none";
        const hoverClass =
          "hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!bg-secondary active:!text-neutral";
        const activeClass = isActive ? "bg-secondary shadow-md" : "";

        const finalClass = `${commonClass} ${hoverClass} ${activeClass}`;

        if (children) {
          return (
            <li key={label} className="relative group">
              <div className="dropdown dropdown-hover dropdown-bottom hidden lg:block !bg-transparent !p-0 !m-0 !border-0 !shadow-none">
                <div tabIndex={0} role="button" className={finalClass}>
                  {icon}
                  <span>{label}</span>
                  <ChevronDownIcon className="h-3 w-3 ml-0.5" />
                </div>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu p-2 bg-base-100 rounded-box w-40 z-[100] shadow-lg border border-base-200 !mt-0"
                >
                  {children.map(child => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={() => {
                          const elem = document.activeElement as HTMLElement;
                          if (elem) elem.blur();
                        }}
                        className={`${
                          pathname === child.href ? "bg-secondary" : ""
                        } hover:bg-secondary focus:bg-secondary py-2 text-sm rounded-lg`}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <details className="lg:hidden">
                <summary className={`${finalClass} list-none [&::-webkit-details-marker]:hidden after:hidden`}>
                  {icon}
                  <span>{label}</span>
                  <ChevronDownIcon className="h-3 w-3 ml-auto" />
                </summary>
                <ul className="p-2 bg-base-100/50 rounded-t-none ml-4 border-l border-base-300">
                  {children.map(child => (
                    <li key={child.href}>
                      <Link
                        href={child.href}
                        onClick={() => {
                          if (closeMenu) closeMenu();
                        }}
                        className={`${
                          pathname === child.href ? "bg-secondary" : ""
                        } py-2 text-sm rounded-lg active:bg-secondary`}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        }

        return (
          <li key={href}>
            <Link
              href={href}
              passHref
              onClick={() => {
                if (closeMenu) closeMenu();
              }}
              className={finalClass}
            >
              {icon}
              <span>{label}</span>
            </Link>
          </li>
        );
      })}
    </>
  );
};

/**
 * Site header
 */
export const Header = () => {
  const { targetNetwork } = useTargetNetwork();
  const isLocalNetwork = targetNetwork.id === hardhat.id;

  const burgerMenuRef = useRef<HTMLDetailsElement>(null);

  // 专门的关闭函数
  const closeMenu = useCallback(() => {
    burgerMenuRef.current?.removeAttribute("open");
  }, []);

  useOutsideClick(burgerMenuRef, closeMenu);

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <details className="dropdown" ref={burgerMenuRef}>
          <summary className="ml-1 btn btn-ghost lg:hidden hover:bg-transparent">
            <Bars3Icon className="h-1/2" />
          </summary>
          <ul className="menu menu-compact dropdown-content mt-3 p-2 shadow-sm bg-base-100 rounded-box w-52">
            {/* 修复问题1：将关闭逻辑下放给子组件，而不是绑定在整个 ul 上 */}
            <HeaderMenuLinks closeMenu={closeMenu} />
          </ul>
        </details>

        <Link href="/" passHref className="hidden lg:flex items-center gap-2 ml-4 mr-6 shrink-0">
          <div className="flex relative w-10 h-10">
            <Image alt="SE2 logo" className="cursor-pointer" fill src="/logo.svg" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-tight">Scaffold-ETH</span>
            <span className="text-xs">Ethereum dev stack</span>
          </div>
        </Link>

        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2 items-center">
          {/* Desktop 模式不需要传 closeMenu */}
          <HeaderMenuLinks />
        </ul>
      </div>
      <div className="navbar-end grow mr-4">
        <RainbowKitCustomConnectButton />
        {isLocalNetwork && <FaucetButton />}
      </div>
    </div>
  );
};
