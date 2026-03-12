import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const IconBase = ({ children, ...props }: IconProps) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="1.8"
    viewBox="0 0 24 24"
    width="18"
    {...props}
  >
    {children}
  </svg>
);

export const ArrowLeftIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </IconBase>
);

export const ArrowRightIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </IconBase>
);

export const PlusIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </IconBase>
);

export const RefreshIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M21 12a9 9 0 0 1-15.5 6.4" />
    <path d="M3 12A9 9 0 0 1 18.5 5.6" />
    <path d="M8 17H5v3" />
    <path d="M16 7h3V4" />
  </IconBase>
);

export const MoreHorizontalIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="5" cy="12" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.25" fill="currentColor" stroke="none" />
  </IconBase>
);

export const PencilIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </IconBase>
);

export const TrashIcon = (props: IconProps) => (
  <IconBase {...props}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </IconBase>
);

export const BoardIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect height="14" rx="2" width="18" x="3" y="5" />
    <path d="M9 5v14" />
    <path d="M15 5v14" />
  </IconBase>
);

export const CardIcon = (props: IconProps) => (
  <IconBase {...props}>
    <rect height="14" rx="2" width="18" x="3" y="5" />
    <path d="M7 10h10" />
    <path d="M7 14h6" />
  </IconBase>
);

export const GripIcon = (props: IconProps) => (
  <IconBase {...props}>
    <circle cx="9" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="16" r="1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="16" r="1" fill="currentColor" stroke="none" />
  </IconBase>
);
