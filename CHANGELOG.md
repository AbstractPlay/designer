# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.3] - 2024-03-05

### Added

* Added `conhex-cells`, `cairo-collinear`, and `cairo-catalan` board styles.

## [1.2.2] - 2024-02-25

### Added

* `hex-of-*` boards now support "alternating symmetry" where each edge of the hex alternates size.
* Added a checkbox for `hex-of-*` and `squares*` boards where, when checked, the board is forced to symmetrical (hexhex or square).

## [1.2.0] - 2023-08-23

### Added

* Board state is now saved as a stack of states. You can "undo," which will take you to the previous state. Every single board click creates a state, though. The system still does not understand what a "move" is. This is basically a domain-specific painting tool.

## [1.1.1] - 2023-08-21

### Fixed

- Fixed the "jumping" problem where selecting pieces and clicking on the board sometimes caused the window to scroll to the top of the page.
- Returning to the Board tab now retains the existing board configuration, but it still clears the board of any pieces.

## [1.1.0] - 2023-08-20

### Added

- Square and rect-of-hex boards can now have cells blocked.

### Known Issues

- At least in Firefox, clicking the board or selecting a piece can cause the browser to jump to the top of the page. I am actively working on tracking this down.

## [1.0.0] - 2023-08-18

Initial release, including peer-to-peer networking.
