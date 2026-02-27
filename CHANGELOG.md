# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.5] - 2026-02-27

### Added

-   Added the `board` colour context and picker. It defaults to the `background` colour when not present, and when both are the same, changing `background` also changes `board`, but `board` can be set independently.

## [1.7.4] - 2026-02-11

### Added

-   Added two new board styles:
    -   `rect-of-tri` is a rectangular board derived from `hex-of-tri`. The `no-border` option will omit the left and right vertical connections.
    -   `hex-of-tri-f` is identical to `hex-of-tri` except you place on the spaces instead of the intersections. Labelling is adjusted to match.

## [1.7.3] - 2026-02-07

### Added

-   You can now flip the x and y coordinates of glyphs. Doesn't affect text overlays, and can cause weirdness when rotating boards.

## [1.7.2] - 2025-08-14

### Added

-   Added the new `pentagonal` and `pentagonal-bluestone` boards. The generator for these sorts of boards is a little slow at larger sizes. If larger boards ever become heavily used, I'll look at efficiency improvements.

## [1.7.1] - 2025-04-06

### Fixed

-   Properly dispose of interim image elements to prevent memory leaks.
-   Add a progress dialog to the animation process so you can't accidentally trigger multiple processes at the same time.

## [1.7.0] - 2025-04-03

### Added

-   Added an animation feature. Create boards in the Play or Annotate tabs and click the camera icon to capture them. From the Animate tab, configure your frames and then generate an animated GIF.
-   Added a named save/load feature for animation queues and for individual board positions. These are saved locally.

## [1.6.1] - 2025-01-13

### Added

-   Added support for half rendering of `hex-of-*` boards.
-   Added the randomized modular hex field option.

## [1.6.0] - 2024-11-13

### Added

-   Added the `circular-wheel` board style.
-   Added support for different enter/exit annotation shapes.

## [1.5.1] - 2024-10-24

### Changed

-   Height and width of all boards is restricted to 50 to avoid accidental crashes. You can still get larger boards by hand adjusting the JSON and importing it, but the input boxes won't allow it.

## [1.5.0] - 2024-09-21

### Added

-   Added support for board rotation and other renderer-wide options.
-   Added colour contexts.

## [1.4.2] - 2024-09-18

### Added

-   Added support for the new `onyx` board.
-   Added support for the new `snubsquare-cells` board.

## [1.4.1] - 2024-09-10

### Added

-   Added support for the new `squares-diamonds` board. Flood-fill only.

## [1.4.0] - 2024-08-18

### Added

-   Added Annotation tab, which supports the basic `move`, `enter`, `exit`, `eject`, and `dots`, annotations.

## [1.3.2] - 2024-07-03

### Added

-   Vertex boards now support blocking.

## [1.3.1] - 2024-06-26

### Fixed

-   Finally fixed the offsetting issue on hex fields and vertex boards. Many thanks to @manaT for finding the issue!

## [1.3.0] - 2024-06-22

### Fixed

-   Fixed the designer after major restructuring of the renderer schema.

### Added

-   Added `conical-hex*` and `pyramid-hex` boards.
-   Added a flood-fill option

## [1.2.3] - 2024-03-05

### Added

-   Added `conhex-cells`, `cairo-collinear`, and `cairo-catalan` board styles.

## [1.2.2] - 2024-02-25

### Added

-   `hex-of-*` boards now support "alternating symmetry" where each edge of the hex alternates size.
-   Added a checkbox for `hex-of-*` and `squares*` boards where, when checked, the board is forced to symmetrical (hexhex or square).

## [1.2.0] - 2023-08-23

### Added

-   Board state is now saved as a stack of states. You can "undo," which will take you to the previous state. Every single board click creates a state, though. The system still does not understand what a "move" is. This is basically a domain-specific painting tool.

## [1.1.1] - 2023-08-21

### Fixed

-   Fixed the "jumping" problem where selecting pieces and clicking on the board sometimes caused the window to scroll to the top of the page.
-   Returning to the Board tab now retains the existing board configuration, but it still clears the board of any pieces.

## [1.1.0] - 2023-08-20

### Added

-   Square and rect-of-hex boards can now have cells blocked.

### Known Issues

-   At least in Firefox, clicking the board or selecting a piece can cause the browser to jump to the top of the page. I am actively working on tracking this down.

## [1.0.0] - 2023-08-18

Initial release, including peer-to-peer networking.
