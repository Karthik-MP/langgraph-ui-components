import type React from "react";

export type CustomTool = {
    label: string;
    icon: React.ReactElement;
    alt?: string;
    onClick: () => void;
};