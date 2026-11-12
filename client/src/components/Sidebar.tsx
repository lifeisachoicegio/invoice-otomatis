import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  Repeat,
  FileSpreadsheet,
  Users,
  Briefcase,
  CreditCard,
  Receipt,
  BarChart3,
  Settings,
  HardDriveDownload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const navItems = [
    { header: 'OVERVIEW' },
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { header: 'INVOICE MANAGEMENT' },
    { name: 'Create Invoice', path: '/invoices/create', icon: FilePlus },
    { name: 'All Invoices', path: '/invoices', icon: FileText },
    { name: 'Recurring Invoices', path: '/recurring', icon: Repeat },
    { name: 'Quotations', path: '/quotations', icon: FileSpreadsheet },
    { header: 'BUSINESS MANAGEMENT' },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Services & Products', path: '/services', icon: Briefcase },
    { header: 'FINANCIAL MANAGEMENT' },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { header: 'SYSTEM' },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Backup & Restore', path: '/backup', icon: HardDriveDownload },
  ];

  return (
    <aside
      className={`h-screen bg-brand-card border-r border-brand-border z-30 transition-all duration-300 flex flex-col shrink-0 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-18 px-5 flex items-center justify-between border-b border-brand-border">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-electric to-brand-violet flex items-center justify-center font-black text-white text-lg shadow-lg shadow-brand-electric/20 shrink-0">
              HZ
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-base tracking-wide leading-none">HYPEZONE</span>
              <span className="text-[10px] text-brand-cyan font-bold tracking-widest mt-1 uppercase">Studio Agency</span>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-electric to-brand-violet flex items-center justify-center font-black text-white text-lg">
            HZ
          </div>
        )}
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item, idx) => {
          if (item.header) {
            if (collapsed) return <div key={idx} className="h-4" />;
            return (
              <div key={idx} className="pt-4 pb-2 px-3 text-[10px] font-bold text-brand-muted/60 tracking-wider">
                {item.header}
              </div>
            );
          }

          const Icon = item.icon!;
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-electric to-brand-indigo text-white shadow-md shadow-brand-electric/25'
                    : 'text-brand-muted hover:text-white hover:bg-brand-surface/70'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Toggle button */}
      <div className="p-3 border-t border-brand-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center py-2 rounded-xl bg-brand-surface text-brand-muted hover:text-white hover:bg-brand-border transition-colors text-xs font-medium"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </aside>
  );
};
