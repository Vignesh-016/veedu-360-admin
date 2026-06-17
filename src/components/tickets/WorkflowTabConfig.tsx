import { IconList, IconTicket, IconTool, IconUser } from "@tabler/icons-react";
import { AdminRole } from "../../lib/types";

type ActiveTicketTab = 'all' | 'unassigned' | 'myTickets' | 'allOpenInProgress';

interface TicketTabConfig {
    key: ActiveTicketTab;
    label: string;
    icon: React.ReactNode;
    allowedRoles: AdminRole[];
    defaultForRoles?: AdminRole[];
}

const ticketWorkflowTabs: TicketTabConfig[] = [
    {
        key: 'all',
        label: "All Tickets",
        icon: <IconList size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'],
        defaultForRoles: ['super-admin']
    },
    {
        key: 'unassigned',
        label: "Unassigned",
        icon: <IconTicket size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'],
    },
    {
        key: 'myTickets',
        label: "My Tickets",
        icon: <IconUser size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'],
        defaultForRoles: ['telecalling-owner-team', 'telecalling-tenant-team']
    },
    {
        key: 'allOpenInProgress',
        label: "All Open/In Progress",
        icon: <IconTool size={16} />,
        allowedRoles: ['super-admin', 'telecalling-owner-team', 'telecalling-tenant-team'],
    }
];

export default ticketWorkflowTabs;
export type { TicketTabConfig, ActiveTicketTab };