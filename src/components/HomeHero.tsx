import {
    Badge,
    Box,
    Button,
    Group,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from "@mantine/core";
import {
    IconBolt,
    IconDeviceFloppy,
    IconArrowRight,
    IconSparkles,
} from "@tabler/icons-react";
import type { PointerEvent } from "react";

interface HomeHeroProps {
    onExplore: () => void;
    onOpenApp: () => void;
}

const resetScene = (element: HTMLElement) => {
    element.style.setProperty("--hero-tilt-x", "-7deg");
    element.style.setProperty("--hero-tilt-y", "-12deg");
    element.style.setProperty("--hero-pointer-x", "68%");
    element.style.setProperty("--hero-pointer-y", "32%");
};

export function HomeHero({ onExplore, onOpenApp }: HomeHeroProps) {
    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;

        event.currentTarget.style.setProperty(
            "--hero-tilt-x",
            `${(0.5 - y) * 14 - 7}deg`,
        );
        event.currentTarget.style.setProperty(
            "--hero-tilt-y",
            `${(x - 0.5) * 20 - 12}deg`,
        );
        event.currentTarget.style.setProperty(
            "--hero-pointer-x",
            `${x * 100}%`,
        );
        event.currentTarget.style.setProperty(
            "--hero-pointer-y",
            `${y * 100}%`,
        );
    };

    return (
        <Box component="section" className="dashboard-hero">
            <div className="dashboard-hero-grid">
                <Stack
                    className="dashboard-hero-copy"
                    gap="md"
                    align="center"
                    ta="center"
                >
                    <Group gap="xs">
                        <ThemeIcon
                            variant="light"
                            color="copper"
                            radius="xl"
                            size={30}
                        >
                            <IconSparkles size={16} />
                        </ThemeIcon>
                        <Text
                            className="dashboard-hero-eyebrow"
                            size="xs"
                            fw={600}
                            tt="uppercase"
                            lts={1.2}
                        >
                            Local filament studio
                        </Text>
                    </Group>

                    <div>
                        <Title order={1} className="dashboard-hero-title">
                            Make every gram{" "}
                            <Text
                                component="span"
                                inherit
                                className="dashboard-hero-accent"
                            >
                                count.
                            </Text>
                        </Title>
                        <Text
                            c="dimmed"
                            mt="sm"
                            maw={660}
                            mx="auto"
                            className="dashboard-hero-description"
                        >
                            Track filament, capture finished prints, and keep
                            your workshop flowing from one calm, private
                            workspace.
                        </Text>
                    </div>

                    <Group className="dashboard-hero-actions" gap="sm">
                        <Button
                            size="md"
                            rightSection={<IconArrowRight size={18} />}
                            onClick={onOpenApp}
                        >
                            Open Spoolbook
                        </Button>
                        <Button
                            size="md"
                            variant="default"
                            leftSection={<IconSparkles size={18} />}
                            onClick={onExplore}
                        >
                            See how it works
                        </Button>
                    </Group>

                    <Group gap="xs" className="dashboard-hero-badges">
                        <Badge
                            variant="light"
                            color="copper"
                            leftSection={<IconBolt size={13} />}
                        >
                            Instant updates
                        </Badge>
                        <Badge
                            variant="light"
                            color="gray"
                            leftSection={<IconDeviceFloppy size={13} />}
                        >
                            Saved locally
                        </Badge>
                    </Group>
                </Stack>

                <Box
                    className="dashboard-hero-visual"
                    role="img"
                    aria-label="Interactive three-dimensional filament spool"
                    onPointerMove={handlePointerMove}
                    onPointerLeave={(event) => resetScene(event.currentTarget)}
                >
                    <div className="dashboard-hero-aura" aria-hidden />
                    <div
                        className="dashboard-hero-orbit dashboard-hero-orbit-one"
                        aria-hidden
                    />
                    <div
                        className="dashboard-hero-orbit dashboard-hero-orbit-two"
                        aria-hidden
                    />
                    <svg
                        className="dashboard-filament-line"
                        viewBox="0 0 420 320"
                        aria-hidden
                    >
                        <path
                            d="M64 278 C 116 222, 106 122, 183 104 S 310 141, 358 54"
                            pathLength="1"
                        />
                    </svg>
                    <div className="dashboard-spool-wrap" aria-hidden>
                        <div className="dashboard-spool-depth" />
                        <svg className="dashboard-spool" viewBox="0 0 240 240">
                            <defs>
                                <radialGradient
                                    id="dashboard-spool-face"
                                    cx="34%"
                                    cy="28%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--mantine-color-white)"
                                    />
                                    <stop
                                        offset="58%"
                                        stopColor="var(--mantine-color-gray-1)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--mantine-color-gray-4)"
                                    />
                                </radialGradient>
                                <linearGradient
                                    id="dashboard-filament"
                                    x1="0%"
                                    y1="0%"
                                    x2="100%"
                                    y2="100%"
                                >
                                    <stop
                                        offset="0%"
                                        stopColor="var(--mantine-color-copper-3)"
                                    />
                                    <stop
                                        offset="52%"
                                        stopColor="var(--mantine-color-copper-6)"
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="var(--mantine-color-copper-9)"
                                    />
                                </linearGradient>
                            </defs>
                            <circle
                                cx="120"
                                cy="120"
                                r="96"
                                fill="url(#dashboard-spool-face)"
                            />
                            <circle
                                cx="120"
                                cy="120"
                                r="69"
                                fill="none"
                                stroke="url(#dashboard-filament)"
                                strokeWidth="36"
                                strokeDasharray="1.5 2.1"
                                pathLength="1"
                            />
                            <g
                                fill="none"
                                stroke="var(--mantine-color-gray-5)"
                                strokeWidth="11"
                                strokeLinecap="round"
                            >
                                <path d="M120 40 V84" />
                                <path d="M120 156 V200" />
                                <path d="M40 120 H84" />
                                <path d="M156 120 H200" />
                            </g>
                            <circle
                                cx="120"
                                cy="120"
                                r="36"
                                fill="var(--app-surface)"
                                stroke="var(--mantine-color-gray-4)"
                                strokeWidth="9"
                            />
                            <circle
                                cx="120"
                                cy="120"
                                r="13"
                                fill="var(--app-background)"
                            />
                            <path
                                d="M64 65 A 82 82 0 0 1 168 42"
                                fill="none"
                                stroke="var(--mantine-color-white)"
                                strokeWidth="8"
                                strokeLinecap="round"
                                opacity="0.72"
                            />
                        </svg>
                    </div>
                    <span className="dashboard-particle dashboard-particle-one" />
                    <span className="dashboard-particle dashboard-particle-two" />
                    <span className="dashboard-particle dashboard-particle-three" />
                </Box>
            </div>
        </Box>
    );
}
