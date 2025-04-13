'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { PlusIcon, NewspaperIcon, ClipboardIcon, ChartIcon, SidebarLeftIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { string } from 'zod';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile, toggleSidebar } = useSidebar();

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 bg-gradient-to-b from-background to-background/95">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <div className="flex flex-col items-start px-2">
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-xl font-bold hover:bg-muted/50 px-2 py-1 rounded-md cursor-pointer transition-all duration-200 bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                  Medical AI
                </span>
              </Link>
              <Link
                href="https://firecrawl.dev/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-sm text-muted-foreground leading-3 ml-2 hover:text-primary transition-colors duration-200">
                  Easy Research 🐬
                </span>
              </Link>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit rounded-full hover:bg-primary/10 transition-all duration-200"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>

        {/* Primary Navigation */}
        <SidebarMenu className="mt-6">
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              isActive={pathname === '/'}
              tooltip="Chat"
              className={`transition-all duration-200 rounded-lg px-3 py-2.5 ${pathname === '/' ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted/50'}`}
            >
              <Link href="/" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                <PlusIcon size={18}  />
                <span>Chat</span>
                {pathname === '/' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem className="mt-1">
            <div className="flex items-center gap-2">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/news' || pathname.startsWith('/news/') && pathname !== '/news/summarize'}
                tooltip="News"
                className={`transition-all duration-200 rounded-lg px-3 py-2.5 flex-grow ${(pathname === '/news' || pathname.startsWith('/news/') && pathname !== '/news/summarize') ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted/50'}`}
              >
                <Link href="/news" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                  <NewspaperIcon size={18}  />
                  <span>News</span>
                  {(pathname === '/news' || pathname.startsWith('/news/') && pathname !== '/news/summarize') && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                </Link>
              </SidebarMenuButton>
              {(pathname === '/news' || pathname.startsWith('/news/') && pathname !== '/news/summarize') && (
                <Button
                  variant="ghost"
                  onClick={toggleSidebar}
                  className="p-1.5 h-fit hover:bg-primary/10 transition-all duration-200"
                >
                  <SidebarLeftIcon size={16} />
                </Button>
              )}
            </div>
          </SidebarMenuItem>
          
          <SidebarMenuItem className="mt-1">
            <div className="flex items-center gap-2">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/news/summarize'}
                tooltip="Summary"
                className={`transition-all duration-200 rounded-lg px-3 py-2.5 flex-grow ${pathname === '/news/summarize' ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted/50'}`}
              >
                <Link href="/news/summarize" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                  <ClipboardIcon size={18}  />
                  <span>Summary</span>
                  {pathname === '/news/summarize' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                </Link>
              </SidebarMenuButton>
              {pathname === '/news/summarize' && (
                <Button
                  variant="ghost"
                  onClick={toggleSidebar}
                  className="p-1.5 h-fit hover:bg-primary/10 transition-all duration-200"
                >
                  <SidebarLeftIcon size={16} />
                </Button>
              )}
            </div>
          </SidebarMenuItem>
          
          <SidebarMenuItem className="mt-1">
            <div className="flex items-center gap-2">
              <SidebarMenuButton 
                asChild 
                isActive={pathname === '/analyse-report'}
                tooltip="Analysis Report"
                className={`transition-all duration-200 rounded-lg px-3 py-2.5 flex-grow ${pathname === '/analyse-report' ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted/50'}`}
              >
                <Link href="/analyse-report" onClick={() => setOpenMobile(false)} className="flex items-center gap-3">
                  <ChartIcon size={18}  />
                  <span>Analysis Report</span>
                  {pathname === '/analyse-report' && <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />}
                </Link>
              </SidebarMenuButton>
              {pathname === '/analyse-report' && (
                <Button
                  variant="ghost"
                  onClick={toggleSidebar}
                  className="p-1.5 h-fit hover:bg-primary/10 transition-all duration-200"
                >
                  <SidebarLeftIcon size={16} />
                </Button>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <SidebarSeparator className="my-3 opacity-50" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 pt-2">{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
