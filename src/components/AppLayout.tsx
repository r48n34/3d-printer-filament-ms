import {
  AppShell,
  Box,
  Burger,
  Group,
  NavLink as MantineNavLink,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconDatabase, IconDisc, IconGauge, IconHistory } from "@tabler/icons-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Overview", icon: IconGauge },
  { to: "/filaments", label: "Filaments", icon: IconDisc },
  { to: "/history", label: "History", icon: IconHistory },
  { to: "/data", label: "Data & backup", icon: IconDatabase },
];

export function AppLayout() {
  const [mobileOpened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();

  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: 256, breakpoint: "sm", collapsed: { mobile: !mobileOpened } }}
      padding={{ base: "md", sm: "xl" }}
    >
      <AppShell.Header className="app-header">
        <Group h="100%" px={{ base: "md", sm: "xl" }} justify="space-between">
          <Group gap="sm">
            <Burger
              opened={mobileOpened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
              aria-label="Toggle navigation"
            />
            <ThemeIcon size={38} radius="md" color="copper">
              <IconDisc size={22} />
            </ThemeIcon>
            <div>
              <Title order={2} fz={20} lh={1}>
                Spoolbook
              </Title>
              <Text size="xs" c="dimmed" mt={3}>
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
            <Text size="xs" tt="uppercase" fw={700} c="dimmed" lts={0.8} px="sm" mb="xs">
              Workshop
            </Text>
            {LINKS.map(({ to, label, icon: Icon }) => {
              const active =
                to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
              return (
                <MantineNavLink
                  key={to}
                  component={NavLink}
                  to={to}
                  label={label}
                  leftSection={<Icon size={19} />}
                  active={active}
                  onClick={close}
                />
              );
            })}
          </Stack>
        </AppShell.Section>
        <AppShell.Section>
          <Box className="local-note" p="md">
            <Text fw={700} size="sm">
              No cloud required
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Your inventory never leaves this device.
            </Text>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box maw={1440} mx="auto">
          <Outlet />
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
