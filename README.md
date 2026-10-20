# claude-skills

This repository holds the Claude Code skills of Fadel M. Megahed. A public record and site of how the skills were made is at https://fmegahed.github.io/claude-skills/.

## Install

1. Clone the repository. This command works in any shell:

   ```
   git clone https://github.com/fmegahed/claude-skills.git
   ```

   In the commands below, `<repo>` is the full path of this clone. Examples: `C:\Users\you\claude-skills` and `/home/you/claude-skills`.

2. Make the folder for the skills, if it does not exist.

   Windows (PowerShell):

   ```powershell
   New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills"
   ```

   macOS or Linux (bash or zsh):

   ```bash
   mkdir -p ~/.claude/skills
   ```

3. Link each skill into that folder. The commands for each skill are below.

On Windows, run steps 2 and 3 in PowerShell, not in Git Bash. In Git Bash, `ln -s` makes a copy, not a link.

## Skills

### replication-materials

This skill keeps the replication records of a research project. It starts a `replication_materials/` folder, records decisions and milestones, and corrects records. In a project with a `replication_materials/` folder, it also checks for a budget row before each paid API call.

Windows (PowerShell). This makes a directory junction:

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\replication-materials" -Target "<repo>\skills\replication-materials"
```

macOS or Linux (bash or zsh):

```bash
ln -s "<repo>/skills/replication-materials" ~/.claude/skills/replication-materials
```

### narrated-demo-video

This skill makes a narrated demo video of a web app or website. It produces a scripted, voiced, captioned MP4 from code. It needs no screen recording, editing timeline, or voice talent.

Windows (PowerShell). This makes a directory junction:

```powershell
New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills\narrated-demo-video" -Target "<repo>\skills\narrated-demo-video"
```

macOS or Linux (bash or zsh):

```bash
ln -s "<repo>/skills/narrated-demo-video" ~/.claude/skills/narrated-demo-video
```

The brand logos are not in this repository. Make the folder `skills/narrated-demo-video/assets/brand/` and put your own logos in it. The Source Serif 4 fonts have their own license. See `skills/narrated-demo-video/assets/fonts/LICENSE.md`.

## Records

- Site: https://fmegahed.github.io/claude-skills/
- Source of the records: `replication_materials/`
