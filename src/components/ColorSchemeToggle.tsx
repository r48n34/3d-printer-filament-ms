import {
    Switch,
    useComputedColorScheme,
    useMantineColorScheme,
} from "@mantine/core";
import { IconMoonStars, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
    const { setColorScheme } = useMantineColorScheme();
    const colorScheme = useComputedColorScheme("light");
    const isDark = colorScheme === "dark";

    return (
        <Switch
            aria-label="Toggle dark mode"
            checked={isDark}
            onChange={(event) =>
                setColorScheme(event.currentTarget.checked ? "dark" : "light")
            }
            offLabel={<IconSun size={14} stroke={2.5} />}
            onLabel={<IconMoonStars size={14} stroke={2.5} />}
            size="md"
        />
    );
}
