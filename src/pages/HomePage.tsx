import {
    Button,
    Card,
    Container,
    Grid,
    Group,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconArrowRight,
    IconBox,
    IconDatabase,
    IconDisc,
    IconHistory,
    IconPrinter,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { ColorSchemeToggle } from "../components/ColorSchemeToggle";
import { HomeHero } from "../components/HomeHero";

import classes from "./HomePage.module.css";

const FEATURES = [
    {
        icon: IconBox,
        title: "Know what is on the shelf",
        description:
            "Organise every spool by material, colour, brand, and starting weight.",
    },
    {
        icon: IconPrinter,
        title: "Log every print",
        description:
            "Record quantity and grams used while Spoolbook keeps the balance current.",
    },
    {
        icon: IconHistory,
        title: "Keep a useful history",
        description:
            "Review prints, measured adjustments, and archived spools in one ledger.",
    },
    {
        icon: IconDatabase,
        title: "Back up when you choose",
        description:
            "Export a portable JSON backup and restore it in another browser.",
    },
] as const;

const STEPS = [
    ["01", "Add a spool", "Enter its material, colour, and starting weight."],
    ["02", "Log a print", "Record the quantity and grams used per item."],
    ["03", "Check the balance", "See what is ready before the next print."],
] as const;

function FeatureCard({
    icon,
    title,
    children,
}: {
    icon: typeof IconBox;
    title: string;
    children: ReactNode;
}) {
    const Icon = icon;

    return (
        <Card className={classes.featureCard} radius="xl" p="xl">
            <ThemeIcon size={44} radius="md" variant="light" color="copper">
                <Icon size={22} aria-hidden="true" />
            </ThemeIcon>
            <Title order={3} fw={500} fz="lg" mt="lg">
                {title}
            </Title>
            <Text c="dimmed" mt="xs" lh={1.65}>
                {children}
            </Text>
        </Card>
    );
}

export function HomePage() {
    const navigate = useNavigate();

    return (
        <div className={classes.page}>
            <header className={classes.header}>
                <Container size="xl">
                    <Group h={72} justify="space-between">
                        <Link to="/home" className={classes.brand}>
                            <Group gap="sm">
                                <ThemeIcon size={34} radius="md" color="copper">
                                    <IconDisc size={21} aria-hidden="true" />
                                </ThemeIcon>
                                <Text fw={500} fz="lg">
                                    Spoolbook
                                </Text>
                            </Group>
                        </Link>
                        <Group gap="xs">
                            <ColorSchemeToggle />
                            <Button
                                className={classes.desktopAction}
                                component={Link}
                                to="/"
                                variant="subtle"
                                rightSection={
                                    <IconArrowRight
                                        size={16}
                                        aria-hidden="true"
                                    />
                                }
                            >
                                Open the app
                            </Button>
                        </Group>
                    </Group>
                </Container>
            </header>

            <main>
                <Container size="xl" className={classes.hero}>
                    <HomeHero
                        onOpenApp={() => navigate("/")}
                        onExplore={() =>
                            document
                                .getElementById("features")
                                ?.scrollIntoView({
                                    behavior: "smooth",
                                    block: "start",
                                })
                        }
                    />
                </Container>

                <section id="features" className={classes.section}>
                    <Container size="xl">
                        <Stack gap="sm" align="center" ta="center" mb={48}>
                            <Text
                                size="sm"
                                fw={500}
                                c="copper.7"
                                tt="uppercase"
                                lts={1}
                            >
                                A clearer workshop
                            </Text>
                            <Title order={2} fw={500} fz={{ base: 32, sm: 42 }}>
                                The full story of every spool
                            </Title>
                            <Text c="dimmed" maw={580} lh={1.65}>
                                A lightweight ledger for the details that
                                matter, from the first gram to the last.
                            </Text>
                        </Stack>
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
                            {FEATURES.map((feature) => (
                                <FeatureCard
                                    key={feature.title}
                                    icon={feature.icon}
                                    title={feature.title}
                                >
                                    {feature.description}
                                </FeatureCard>
                            ))}
                        </SimpleGrid>
                    </Container>
                </section>

                <section className={`${classes.section} ${classes.steps}`}>
                    <Container size="xl">
                        <Grid gap={{ base: 32, md: 72 }} align="center">
                            <Grid.Col span={{ base: 12, md: 4 }}>
                                <Text
                                    size="sm"
                                    fw={500}
                                    c="copper.7"
                                    tt="uppercase"
                                    lts={1}
                                >
                                    Simple by design
                                </Text>
                                <Title order={2} fw={500} fz={36} mt="sm">
                                    Three steps to a dependable shelf
                                </Title>
                                <Text c="dimmed" mt="md" lh={1.65}>
                                    Spoolbook keeps the workflow short, so your
                                    inventory stays useful after every job.
                                </Text>
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, md: 8 }}>
                                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                                    {STEPS.map(
                                        ([number, title, description]) => (
                                            <div key={number}>
                                                <Text
                                                    className={
                                                        classes.stepNumber
                                                    }
                                                    fz={36}
                                                    fw={500}
                                                    c="copper.6"
                                                >
                                                    {number}
                                                </Text>
                                                <Title
                                                    order={3}
                                                    fw={500}
                                                    fz="lg"
                                                >
                                                    {title}
                                                </Title>
                                                <Text
                                                    size="sm"
                                                    c="dimmed"
                                                    mt="xs"
                                                    lh={1.6}
                                                >
                                                    {description}
                                                </Text>
                                            </div>
                                        ),
                                    )}
                                </SimpleGrid>
                            </Grid.Col>
                        </Grid>
                    </Container>
                </section>

                <section className={classes.section}>
                    <Container size="md" ta="center">
                        <ThemeIcon
                            size={54}
                            radius="xl"
                            variant="light"
                            color="copper"
                            mx="auto"
                        >
                            <IconDisc size={27} aria-hidden="true" />
                        </ThemeIcon>
                        <Title
                            order={2}
                            fw={500}
                            fz={{ base: 32, sm: 44 }}
                            mt="lg"
                        >
                            Make the next print the easy one.
                        </Title>
                        <Text c="dimmed" size="lg" mt="md">
                            Start your local filament ledger. No sign-up needed.
                        </Text>
                        <Button
                            component={Link}
                            to="/"
                            size="lg"
                            mt="xl"
                            rightSection={
                                <IconArrowRight size={18} aria-hidden="true" />
                            }
                        >
                            Open Spoolbook
                        </Button>
                    </Container>
                </section>
            </main>

            <footer className={classes.footer}>
                <Container size="xl">
                    <Group justify="space-between" py="xl" gap="md" wrap="wrap">
                        <Text size="sm" c="dimmed">
                            Spoolbook · A private filament ledger
                        </Text>
                        <Button
                            component={Link}
                            to="/privacy"
                            variant="subtle"
                            color="gray"
                            size="compact-sm"
                        >
                            Privacy
                        </Button>
                    </Group>
                </Container>
            </footer>
        </div>
    );
}
