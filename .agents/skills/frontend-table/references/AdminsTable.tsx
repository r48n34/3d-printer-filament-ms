import {
    MantineReactTable,
    useMantineReactTable,
    type MRT_ColumnDef,
} from 'mantine-react-table';

import { AdminUser, SeletabledInfo } from "@backend/routers/admins/admins.service";
import { useMemo } from 'react';
import { Box, Group, Text } from '@mantine/core';
import BooleanBadge from '../../common/BooleanBadge';

type AdminsTableProps = {
    data: AdminUser[];
    seletabledData: SeletabledInfo;
    mutate?: Function;
}

function AdminsTable({ data, seletabledData, mutate }: AdminsTableProps) {

    const columns = useMemo<MRT_ColumnDef<AdminUser>[]>(
        () => [
            {
                id: 'Actions',
                header: 'Actions',
                accessorFn: (row: AdminUser) => row.userId,
                Cell: ({ row }) => (
                    <Group>
                        {/* Some other components */}
                    </Group>
                ),
                size: 90,
                enableSorting: false
            },
            {
                id: 'userId',
                header: 'Id',
                accessorFn: (row: AdminUser) => row.userId,
                filterFn: 'includesString',
                size: 80
            },
            {
                id: 'ssoUserName',
                header: 'Name',
                accessorFn: (row: AdminUser) => row.ssoUserName,
                filterFn: 'includesString',
            },
            {
                id: 'ssoEmail',
                header: 'Email',
                accessorFn: (row: AdminUser) => row.ssoEmail,
                filterFn: 'includesString',
            },
            {
                id: 'team',
                header: 'Team',
                filterFn: 'includesString',
                accessorFn: (row: AdminUser) => row.team ? row.team.teamId : -1,
                Cell: ({ row }) => (
                    <Text fz={14}>
                        {row.original.team ? row.original.team.teamName : "N/A"}
                    </Text>
                )
            },
            {
                id: 'ssoUno',
                header: 'Uno',
                accessorFn: (row: AdminUser) => row.ssoUno,
                filterFn: 'includesString',
            },
            {
                id: 'banned',
                header: 'Banned',
                filterFn: 'includesString',
                accessorFn: (row: AdminUser) => row.banned ? "Yes" : "No",
                Cell: ({ row }) => <BooleanBadge bool={row.original.banned} />
            },
        ], [],
    );

    const table = useMantineReactTable({
        columns,
        data,
        enableStickyHeader: true,
        enableColumnPinning: true,

        enableFilterMatchHighlighting: false,
        enableColumnOrdering: false,

        enableColumnResizing: false,

        sortDescFirst: true,
        positionGlobalFilter: "left",
        autoResetPageIndex: false,

        mantineTableProps: {
            striped: "odd",
            withColumnBorders: true,
            withRowBorders: true,
            withTableBorder: true,
            stickyHeader: true,
        },
        initialState: {
            density: "xs",
            showColumnFilters: true,
            pagination: {
                pageIndex: 0,
                pageSize: 10,
            },
        },

    });

    return (
        <Box>
            <Group justify="flex-end" mb={12}>
                <Text c="dimmed" fz={12} mb={48}>
                    Total {data.length} records
                </Text>
            </Group>

            <MantineReactTable
                table={table}
            />
        </Box>
    )
}

export default AdminsTable