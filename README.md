# Mixxx Novation Launchpad Mapping

```
from http://www.mixxx.org/forums/viewtopic.php?f=7&t=3739
created by zestoi
published on Mon May 21, 2012 9:56 am
updated on Tue May 22, 2012 5:06 am
```

## USAGE

```
top left arrow keys for track/library browsing
top right 'mixer' button toggles to the mixer page
bottom right is a shift button and above that a 2nd shift button
```

### MAIN GRID

the main grid is split into two halves, one for each deck. each half is mapped the same


Row | Column 1 | 2           | 3                   | 4
----|----------|-------------|---------------------|---
1   | quantize | keylock     | headphone cue       | load
2   | flanger  | flanger     | gator               | gator
3   | loops 1  | 1/2         | 1/4                 | 1/8
4   | loop in  | loop out    | loop exit/retrigger | deck reverse
5   | hotcue 1 | 2           | 3                   | 4
6   | hotcue 5 | 6           | 7                   | 8
7   | cue      | reset pitch | pitch down          | pitch up
8   | play     | sync        | pitchbend down      | pitchbend up


```
shift + hotcue = delete hotcue
shift2 + hotcue = needle drop for quickly scanning through a track
shift + sync = adjust beatgrid
```

#### with the deck playing:

```
pitchbend = normal pitchbend
shift + pitchbend = pitchbend more
```

#### when the deck is not playing:

```
pitchbend = forward wind/rewind thru the track
shift + pitchbend = very fine fwd/rew to help align beatgrids
```

### MAIN GRID (mixer mode)

the mixer page basically consists of 8 columns of virtual faders ala ableton live.

```
col 1-3: deck A low/mid/high virtual eq faders with eq kills at the top
col 4: volume deck A
col 5: volume deck B
col 6-8: deck B low/mid/high virtual eq faders with eq kills at the top
```

###(make sure you're not running Automap)

## UPDATES on Tue May 22, 2012 5:06 am

* enabled flashing colors
* use flashing red for eq kills
* play button flashes when the track is 90% the way thru
* using internal buffering in the launchpad so that led updates between pages appear instant
* shift/shift2 buttons (arm/solo) only now show up on the main page (page1)
* a new toggle shift on the mixer page (page2) on the "vol" button turns the central two volume 'faders' into vumeters

the code will support as many 'pages' with full led recall when switching between them. i only needed two for now, hence using the 'mixer' button as a toggle to change pages.

there's also plenty of other buttons unmapped at the moment that could be used.

## ATTACHMENTS (extracted to this repo)
NovationLaunchpad-20120522.zip
