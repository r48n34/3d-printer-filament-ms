import {
    AppShell,
    Box,
    Group,
    NavLink as MantineNavLink,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconDatabase,
    IconDisc,
    IconGauge,
    IconHistory,
} from "@tabler/icons-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const LINKS = [
    { to: "/", label: "Overview", icon: IconGauge },
    { to: "/filaments", label: "Filaments", icon: IconDisc },
    { to: "/history", label: "History", icon: IconHistory },
];

export function AppLayout() {
    const location = useLocation();

    return (
        <>
            <AppShell
                header={{ height: 64 }}
                navbar={{
                    width: 256,
                    breakpoint: "sm",
                    collapsed: { mobile: true },
                }}
                padding={{ base: "md", sm: "xl" }}
            >
                <AppShell.Header className="app-header">
                    <Group
                        h="100%"
                        px={{ base: "md", sm: "xl" }}
                        justify="space-between"
                    >
                        <Group gap="sm">
                            <ThemeIcon size={38} radius="md" color="copper">
                                <IconDisc size={22} />
                            </ThemeIcon>
                            <div>
                                <Title order={2} fz={20} lh={1}>
                                    Spoolbook
                                </Title>
                                <Text
                                    className="app-brand-subtitle"
                                    size="xs"
                                    c="dimmed"
                                    mt={3}
                                >
                                    Filament ledger
                                </Text>
                            </div>
                        </Group>
                        <Text size="xs" c="dimmed" visibleFrom="sm">
                            Stored locally in this browser
                        </Text>
                    </Group>
                </AppShell.Header>

                <AppShell.Navbar p="md" className="app-navbar">
                    <AppShell.Section grow>
                        <Stack gap={4}>
                            <Text
                                size="xs"
                                tt="uppercase"
                                fw={700}
                                c="dimmed"
                                lts={0.8}
                                px="sm"
                                mb="xs"
                            >
                                Workshop
                            </Text>
                            {LINKS.map(({ to, label, icon: Icon }) => {
                                const active =
                                    to === "/"
                                        ? location.pathname === "/"
                                        : location.pathname.startsWith(to);
                                return (
                                    <MantineNavLink
                                        key={to}
                                        component={NavLink}
                                        to={to}
                                        label={label}
                                        leftSection={<Icon size={19} />}
                                        active={active}
                                    />
                                );
                            })}
                        </Stack>
                    </AppShell.Section>

                    <AppShell.Section>
                        <MantineNavLink
                            component={NavLink}
                            to={"/data"}
                            label={"Data & backup"}
                            leftSection={<IconDatabase size={19} />}
                        />
                    </AppShell.Section>
                </AppShell.Navbar>

                <AppShell.Main>
                    <Box maw={1440} mx="auto">
                        <Outlet />
                    </Box>
                </AppShell.Main>
            </AppShell>

            <Box
                component="nav"
                className="mobile-tabbar"
                hiddenFrom="sm"
                aria-label="Main navigation"
            >
                {LINKS.map(({ to, label, icon: Icon }) => {
                    const active =
                        to === "/"
                            ? location.pathname === "/"
                            : location.pathname.startsWith(to);
                    return (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === "/"}
                            className="mobile-tab"
                            data-active={active || undefined}
                        >
                            <Icon size={20} stroke={active ? 2.4 : 1.8} />
                            <span>
                                {label === "Data & backup" ? "Data" : label}
                            </span>
                        </NavLink>
                    );
                })}
            </Box>
        </>
    );
}
