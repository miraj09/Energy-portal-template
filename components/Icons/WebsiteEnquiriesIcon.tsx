import * as React from "react";

type Props = React.ComponentProps<"svg"> & { title?: string };

/** Envelope/message icon for Website Enquiries sidebar item. */
const WebsiteEnquiriesIcon = ({ title, ...props }: Props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden={title ? undefined : true}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
      stroke="currentColor"
      strokeWidth="1.75"
      fill="none"
    />
    <path
      d="M5.5 7.5 12 12.25 18.5 7.5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

export default WebsiteEnquiriesIcon;
