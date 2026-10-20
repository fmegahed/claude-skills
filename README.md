# claude-skills

This repository holds the Claude Code skills of Fadel M. Megahed. A public record and site of how the skills were made is at https://fmegahed.github.io/claude-skills/.

## Skills

### replication-materials

This skill keeps the replication records of a research project. It starts a `replication_materials/` folder, records decisions and milestones, and corrects records. It also checks the records before any paid API call.

Install on Windows:

```
cmd /c mklink /J "%USERPROFILE%\.claude\skills\replication-materials" "<repo>\skills\replication-materials"
```

Install on macOS or Linux:

```
ln -s "<repo>/skills/replication-materials" ~/.claude/skills/replication-materials
```

### narrated-demo-video

This skill makes a narrated demo video of a web app or website. It produces a scripted, voiced, captioned MP4 from code. It needs no screen recording, editing timeline, or voice talent.

Install on Windows:

```
cmd /c mklink /J "%USERPROFILE%\.claude\skills\narrated-demo-video" "<repo>\skills\narrated-demo-video"
```

Install on macOS or Linux:

```
ln -s "<repo>/skills/narrated-demo-video" ~/.claude/skills/narrated-demo-video
```

The brand logos are not in this repository. Add your own logos under `assets/brand/`. The Source Serif 4 fonts are under their own licence. See `assets/fonts/LICENSE.md`.

## Records

- Site: https://fmegahed.github.io/claude-skills/
- Source of the records: `replication_materials/`
