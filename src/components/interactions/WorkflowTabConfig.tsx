import { IconMessageCircle, IconUserCheck, IconUsers } from "@tabler/icons-react";
import { AdminRole } from "../../lib/types";

type ActiveInteractionTab = 'all' | 'assignableToMe' | 'myAssigned';

interface InteractionTabConfig {
    key: ActiveInteractionTab;
    label: string;
    icon: React.ReactNode;
    allowedRoles: AdminRole[];
    defaultForRoles?: AdminRole[];
}

const interactionWorkflowTabs: InteractionTabConfig[] = [
    {
        key: 'all',
        label: "All Interactions",
        icon: <IconMessageCircle size={16} />,
        allowedRoles: ['super-admin', 'telecalling-tenant-team'],
        defaultForRoles: ['super-admin']
    },
    {
        key: 'assignableToMe',
        label: "Assignable to Me",
        icon: <IconUsers size={16} />,
        allowedRoles: ['super-admin', 'telecalling-tenant-team'],
        defaultForRoles: ['telecalling-tenant-team']
    },
    {
        key: 'myAssigned',
        label: "My Assigned",
        icon: <IconUserCheck size={16} />,
        allowedRoles: ['super-admin', 'telecalling-tenant-team']
    }
];

function getDefaultInteractionTab(userRoles: AdminRole[], availableTabs: InteractionTabConfig[]): ActiveInteractionTab {
    let defaultTabKey: ActiveInteractionTab = 'all';
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


export default interactionWorkflowTabs;
export type { InteractionTabConfig, ActiveInteractionTab };
export { getDefaultInteractionTab };