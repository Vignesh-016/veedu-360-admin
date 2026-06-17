import { IconBriefcase, IconBuilding, IconClipboardCheck, IconUsers } from "@tabler/icons-react";
import { AdminRole } from "../../lib/types";

export type WorkflowTab = 'all' | 'assignableOwnerContact' | 'myOwnerContactAssignments' | 'assignableMarketing' | 'myMarketingAssignments';

export interface WorkflowTabConfig {
    key: WorkflowTab;
    label: string;
    icon: React.ReactNode;
    allowedRoles: AdminRole[];
    defaultForRoles?: AdminRole[];
}

export const propertyWorkflowTabs: WorkflowTabConfig[] = [
    {
        key: 'all',
        label: "All Properties",
        icon: <IconBuilding size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team', 'sales-team', 'marketing-team'],
        defaultForRoles: ['super-admin', 'telecalling-tenant-team', 'sales-team', 'accounts-team']
    },
    {
        key: 'assignableOwnerContact',
        label: "Owner Contact Queue",
        icon: <IconUsers size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team'],
        defaultForRoles: ['telecalling-owner-team']
    },
    {
        key: 'myOwnerContactAssignments',
        label: "My Owner Assignments",
        icon: <IconClipboardCheck size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team']
    },
    {
        key: 'assignableMarketing',
        label: "Marketing Queue",
        icon: <IconBriefcase size={16} />,
        allowedRoles: ['super-admin']
    },
    {
        key: 'myMarketingAssignments',
        label: "My Marketing Tasks",
        icon: <IconClipboardCheck size={16} />,
        allowedRoles: ['super-admin', 'marketing-team'],
        defaultForRoles: ['marketing-team']
    }
];


export function getDefaultPropertyTabForUser(userRoles: AdminRole[], availableTabs: WorkflowTabConfig[]): WorkflowTab {
    let defaultTabKey: WorkflowTab = 'all';
    for (const role of userRoles) {
        const foundDefault = availableTabs.find(tab => tab.defaultForRoles?.includes(role));
        if (foundDefault) {
            defaultTabKey = foundDefault.key;
            break;
        }
    }
    if (!availableTabs.find(vt => vt.key === defaultTabKey)) {
        defaultTabKey = availableTabs[0]?.key || 'all';
    }
    return defaultTabKey;
}
