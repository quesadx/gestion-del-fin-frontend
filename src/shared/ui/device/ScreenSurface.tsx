import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { crtOn } from '@/shared/lib/motion';
import { StatusBar } from './StatusBar';

interface Props {
  children: ReactNode;
}

const NAV_ITEMS = [
  { path: '/dashboard', label: 'STAT' },
  { path: '/inventory', label: 'INV' },
  { path: '/people', label: 'DATA' },
  { path: '/explorations', label: 'MAP' },
  { path: '/transfers', label: 'RADIO' },
];

export function ScreenSurface({ children }: Props) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const variants = reduceMotion ? {} : crtOn;

  return (
    <div className="pip-screen-well">
      <div className="pip-screen crt-screen">
        <div className="pip-content">
          <StatusBar />

          <div className="pip-h">
            &gt;{' '}
            {NAV_ITEMS.map((item, index) => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <span key={item.path}>
                  <Link className={`pip-tab${isActive ? ' active' : ''}`} to={item.path}>
                    {item.label}
                  </Link>
                  {index < NAV_ITEMS.length - 1 ? '  /  ' : ''}
                </span>
              );
            })}
          </div>
          <div className="pip-divider" />

          <motion.div
            key={location.pathname}
            className="pip-grid"
            variants={variants}
            initial="initial"
            animate="animate"
          >
            {children}
          </motion.div>

          <div className="pip-divider" />
          <div className="pip-footer">
            <span>
              &gt; SYSTEM NOMINAL
              <span className="pip-cursor" />
            </span>
            <span className="pip-label">
              UPLINK <span className="pip-spin" />
            </span>
          </div>
        </div>

        <div className="pip-scanlines" />
        <div className="pip-roll" />
        <div className="pip-flicker" />
        <div className="pip-vignette" />
        <div className="pip-boot" />
      </div>
    </div>
  );
}
