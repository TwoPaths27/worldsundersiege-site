# V19.9.7.5a — Hand Spacing Hotfix

- Fixed large invisible gaps between cards caused by measuring an inherited layout box instead of the visible card width.
- Card X positions now use the CSS `left` property, while transforms are reserved for fan height, rotation, hover, and selection.
- Added safe width and height bounds so unrelated CSS cannot stretch the adaptive spacing calculation.
- Preserved compression, centering, hover enlargement, and large-hand fitting.
