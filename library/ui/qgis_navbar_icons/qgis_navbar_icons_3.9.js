/**
 * @license Mozilla Public License Version 2.0
 * This script has been developed by the "community"
 * There isn't any guarantee that this script will work on another version of Lizmap Web Client.
 */

/**
 * QGIS icons in the map navigation bar
 *
 * Replaces the icons of the Lizmap navigation bar (pan, zoom to area, zoom to full
 * extent, zoom in, zoom out, previous/next extent) with the QGIS desktop icons,
 * so users find the same toolbar as in QGIS.
 *
 * - The SVG icons are embedded in this file (data URIs): nothing to upload.
 * - Lizmap rewrites the `class` attribute of the buttons on each state change
 *   (`<lizmap-navbar>` web component), so the CSS only relies on Lizmap's own
 *   classes (`button.btn`, `.active`) with a higher specificity than map.css.
 * - On small screens the bar is compacted and the tools that are useless with
 *   a finger (pan, zoom to area, history) are hidden.
 *
 * Icons: QGIS default theme (https://github.com/qgis/QGIS/tree/master/images/themes/default),
 * © QGIS contributors, GNU GPL v2 or later.
 *
 * Tested with Lizmap Web Client 3.9.12.
 */
(function () {
    'use strict';

    const TAG = '[QGIS navbar icons]';

    // ----------------------------------------------------------- Settings
    const ICON_SIZE = 22;            // px
    const HIDE_SLIDER = false;       // true = hide the zoom slider between + and -
    const MOBILE_BREAKPOINT = 768;   // px, screen width under which the bar is compacted
    const MOBILE_ICON_SIZE = 18;     // px
    const MOBILE_HIDE = [            // tools hidden on small screens
        '#navbar button.pan',        // dragging with a finger already pans the map
        '#navbar button.zoom',       // zoom to area is awkward with a finger
        '#navbar .history',          // previous / next extent
    ];

    const SVG = {
        mActionZoomToArea: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0xLjI5Njg1MyA5LjY1MTQ0MTkgMTcuNjE3NTU2LS4xNDgwOTM1djEzLjIxNDI4ODZoLTE3LjYxNzU1NnYtMTMuMDY2MTMzeiIgc3R5bGU9Im9wYWNpdHk6Ljk5O2ZpbGw6bm9uZTtzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MS4wNjI7c3Ryb2tlLWRhc2hhcnJheToyLjEyNCAyLjEyNDtzdHJva2UtZGFzaG9mZnNldDozLjYxMDgiLz48cGF0aCBkPSJtMTcuOTYxMjIgN2MwIDMuMzU0NzEyLTIuNjY4OTI5IDYuMDc0MjQ0LTUuOTYxMjIgNi4wNzQyNDRzLTUuOTYxMjIwMy0yLjcxOTUzMi01Ljk2MTIyMDMtNi4wNzQyNDRjMC0zLjM1NDcxMjEgMi42Njg5MjkzLTYuMDc0MjQzNTUgNS45NjEyMjAzLTYuMDc0MjQzNTVzNS45NjEyMiAyLjcxOTUzMTQ1IDUuOTYxMjIgNi4wNzQyNDM1NXoiIHN0eWxlPSJvcGFjaXR5Oi44O2ZpbGw6I2U2ZTZlNjtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6Ljc1MjE4MztzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtZGFzaG9mZnNldDo3IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjQwMDM1NTMgMCAwIDEuMzc0MjAxNCAtMS42NzM4MjkgNy4yNDk1MDgpIi8+PHBhdGggZD0ibTcuODI2MDg2NiAyMi4wODc2NDRjMCAyLjA4NjgwNyAyLjA4Njk1NjggMi4wODY4MDcgMi4wODY5NTY4IDIuMDg2ODA3cy03LjMwNDM0ODIgNy4zMDM4MjgtNy4zMDQzNDgyIDcuMzAzODI4bC0yLjA4Njk1NjU5LTIuMDg2ODA5eiIgZmlsbD0iI2ZmY2MzMCIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiIHN0cm9rZS13aWR0aD0iMS4wNDM0NDEiLz48cGF0aCBkPSJtNi4yNjA4NjkyIDIzLjY1Mjc0OSAyLjA4Njk1NjUtMi4wODY4MDcgMi4wODY5NTUzIDIuMDg2ODA3LTIuMDg2OTU1MyAyLjA4NjgwOXoiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNTA1MDUwIiBzdHJva2Utd2lkdGg9IjEuMDQzNDQxIi8+PC9nPjxwYXRoIGQ9Im0xMC40MzQ3ODEgMTIuMTc1MzA1YzIuMDg2OTU3LTMuMTMwMjEyNyA0LjYzNTM5MS0zLjU0NTU0NSA2LjI2MDg3MS0yLjA4NjgxIDEuNjI1NDggMS40NTg3MzktMi4wODY5NTcgMS4wNDM0MDUtNC4xNzM5MTQgMy4xMzAyMTUtMi4wODY5NTcgMi4wODY4MDYgMCA2LjI2MDQyNC0yLjA4Njk1NyA2LjI2MDQyNC0yLjA4Njk1NTMgMC0yLjA4Njk1NTMtNC4xNzM2MTggMC03LjMwMzgyOXoiIGZpbGw9IiNmY2ZmZmYiIGZpbGwtcnVsZT0iZXZlbm9kZCIgb3BhY2l0eT0iLjciLz48cGF0aCBkPSJtMi4wODY5NTYxIDI4Ljg2OTc3IDQuMTczOTEzMS00LjE3MzYxOCIgb3BhY2l0eT0iLjUiIHN0cm9rZT0iI2ZjZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjEuMDQzNDQxIi8+PC9nPjwvc3ZnPg==',
        mActionPan: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0ibTkuMzc5NzY0MS43NTQ5OTc5M2MtLjk4MjEyMiAwLTEuODkyNTAyMS42MjYwOTUyNy0xLjg5MjUwMjEgMS40OTYxNTI0Ny0uMDAwMDAyNy4wMDEwMS0uMDAwMDAyNy4wMDIwMiAwIC4wMDMwM2wuMDU4MjYxNCA4LjE5NjYxMjYtLjkzMzg1MzMtMi4wOTE1OTI2Yy0uMDI1MTk4NS0uMDU3MTI4NS0uMDU5NzcxNi0uMTExMjItLjEwMjM4NzEtLjE2MDE5LS4zNjc2MzA2LS40MTc4OTMtLjg0OTU3ODEtLjcwNTQ2NjQtMS4zNTU4MjYxLS43NzY4MDI3LS41MDYzMDE3LS4wNzEzODM4LS45MjE1MzY4LjAyOTUzNzYtMS4zMjIyNDg4LjExNDgzOTgtLjYwNzYzOTkuMTI5MzcyNS0uOTU2MjE5My41NzAwMzM4LTEuMDk0NTU3Mi45ODUzNzA4LS4xMzE0MzU1LjM5NDY5Ni0uMTE0NzAzLjgyMDYzOC4wNjE3OTYgMS4yMzMxODExaC0uMDAxNzdsMi4wMjg0MTA4IDYuMDgxNDA1NmMuMDE2MzUuMDQ5NDMuMDM5NTE2LjA5NzIzLjA2ODg2NC4xNDIwNmwzLjQwNzE1NjQgNS4xODIxODkuODIyNjg0NCAyLjM2OTY5N2MuMDk0MjEyLjI3MDM1Ni40MTE4OTc5LjQ3MTA5MS43NDE0NDk3LjQ2ODQ5NGw3LjgxNTMxMTgtLjA1NDM5Yy4zNDY2NjEtLjAwMjkuNjcyODg0LS4yMzIzMjkuNzQzMjE5LS41MjI5MzVsMi4xMjczMTktOC43NTMzNTNjLjAwMjctLjAxMDUyLjAwNTEtLjAyMTA5LjAwNzEtLjAzMTcxLjEwNTI1NC0uNTczNDkuMDY3ODItMS41Mzc1MTEuMDQyMzUtMi41MzE0MDMtLjAxMjc2LS40OTY5NDYtLjAyOS0uOTc4MTI3LS4wNDA1OS0xLjM1MTA5Ny0uMDExNjYtLjM3MjkyMS0uMDA4Ny0uNzIzNjktLjAxNDE0LS42NTQzODcuMDAxMi0uMDE1MDguMDAxOC0uMDMwMTkuMDAxOC0uMDQ1M3YtMi45MzM0MzhjLjAwMDE2My0uMDQ3NzE3LS4wMDU4LS4wOTU0NDctLjAxNzY4LS4xNDIwNjMxLS4wOTI2MDMtLjM1Njk3MDEtLjIyMjIxMy0uNjkyOTY4My0uNTE5MDQ2LS45ODY4Mzg3LS4yNzU5MDItLjI3MzEzNDctLjc2MjQzNS0uNDQ1MjA2MS0xLjIxOTg2NC0uNDIzMTk0NHYtLjAwNjAxYy0uMDIxMDQgMC0uMDQwOTIuMDA1MzUtLjA2MTguMDA2MDEtLjAxNDAzLjAwMTI5LS4wMjg0NC0uMDAxNjEtLjA0MjM1IDB2LjAwNDU1Yy0uMzE5MzE2LjAxNzU2MS0uNjE5NjgxLjExMDgxNjEtLjg2NjgxMy4yNTY5NDZ2LS4xOTM0NjcyYzAtLjg3MDU3ODItLjkxMTcwOC0xLjQ5NjE4NDktMS44OTQyNjctMS40OTYxODQ5aC0uMDA1M2MtLjU2MDU4NiAwLTEuMDkxNTE5LjIwODg1MTQtMS40NDkzNzcuNTQ1NjA4M3YtLjg4MTA4NzFjMC0uODY5MTU3Ny0uOTExMzIxLTEuNDk0NjcxOS0xLjg5MjQ0Ni0xLjQ5NDY3MTktLjQ4NzUyNSAwLS45NTc4NzUuMTUzNzUyMy0xLjMwODE2Ni40MTU2MjAydi0uNDc1NDkzOGMwLS44Njg2Mzc1LS45MDg2MTctMS40OTYxNTcyNy0xLjg5MDczNTMtMS40OTYxNTcyN3oiIGZpbGw9IiNjY2MiIHN0cm9rZS13aWR0aD0iMS4xNDg5NzkiLz48cGF0aCBkPSJtOS43MzYyNDAxLjM0MDMyMjQxYy0uOTgyMTE5MiAwLTEuODkyNTAyNi42MjYwOTAyOC0xLjg5MjUwMjYgMS40OTYxNDc4OS0uMDAwMDAyNy4wMDEwMS0uMDAwMDAyNy4wMDIwMiAwIC4wMDMwM2wuMDU4MjYzOCA4LjA5MTg2Mi0uOTMzOTA4Ni0yLjA5MTU5MzRjLS4wMjUxOTg4LS4wNTcxMjc1LS4wNTk3NzE5LS4xMTEyMTgtLjEwMjM4NzEtLjE2MDE4NzMtLjM2NzU3NzctLjQxNzg5MzctLjg0OTUyNTYtLjcwNTQ2ODEtMS4zNTU4MjctLjc3NjgwNDUtLjUwNjI0NTUtLjA3MTM4MzgtLjkyMTUzNzcuMDI5NTM4NS0xLjMyMjI0ODguMTE0ODQwNy0uNjA3NTg0OS4xMjkzNzE0LS45NTYyMTkyLjU3MDAzMjktMS4wOTQ1MDI3Ljk4NTM3MDgtLjEzMTQ5MDYuMzk0Njk2MS0uMTE0NzAyNC44MjA2MzY3LjA2MTc0MTQgMS4yMzMxNzkxaC0uMDAxNzFsMi4wMjg0MSA2LjA4MTQwODNjLjAxNjMzNC4wNDk0NC4wMzk0ODEuMDk3MjMuMDY4ODExLjE0MjA1N2wzLjQwNzIwOTkgNS4xODIxODkuODIyNjg1NSAyLjM2OTY5OWMuMDk0MjExLjI3MDM1Ny40MTE4OTY3LjQ3MTA5Mi43NDE0NDkxLjQ2ODQ5N2w3LjgxNTMxNi0uMDU0MzljLjM0NjY2Mi0uMDAyOS42NzI4ODItLjIzMjMyOS43NDMyMTctLjUyMjkzNWwyLjEyNzI2Ni04Ljc1MzMwNGMuMDAyNy0uMDEwNTQuMDA1LS4wMjExMi4wMDcxLS4wMzE3Ny4xMDUzMTQtLjU3MzQ0LjA2Nzg3LTEuNTM3NTExLjA0MjQyLTIuNTMxNDAxLS4wMTI3Ni0uNDk2OTQ0LS4wMjktLjk3ODEyNy0uMDQwNjQtMS4zNTEwOTYtLjAxMTU5LS4zNzI5MjMyLS4wMDg2LS43MjM2OTEzLS4wMTQxNC0uNjU0MzQzMS4wMDEyLS4wMTUwOTQuMDAxOC0uMDMwMjMuMDAxOC0uMDQ1MzU0di0yLjkzMzM4ODZjLjAwMDE3NS0uMDQ3NzE0LS4wMDU4LS4wOTU0NDQtLjAxNzY1LS4xNDIwNTk3LS4wOTI2MS0uMzU3MDA3MS0uMjIyMjE1LS42OTMwMDYtLjUxOTEwNi0uOTg2ODc1My0uMjc1OTA0LS4yNzMxMzctLjc2MjQzNi0uNDQ1MjA3Mi0xLjIxOTg2NC0uNDIzMTQ3di0uMDA2MDdjLS4wMjA5OSAwLS4wNDA4Ny4wMDUzNC0uMDYxOC4wMDYwNy0uMDE0MDMuMDAxMjQtLjAyODM5LS4wMDE2Ni0uMDQyMzYgMHYuMDA0NDljLS4zMTkyNTQuMDE3NTY2LS42MTk2Mi4xMTA4MTkzLS44NjY4MDcuMjU2OTQ4M3YtLjE5MzQ2NTRjMC0uODcwNTc5Mi0uOTExNjU2LTEuNDk2MTM5Ny0xLjg5NDIxNS0xLjQ5NjEzOTdoLS4wMDUzYy0uNTYwNTkgMC0xLjA5MTU3NS4yMDg4MDUyLTEuNDQ5Mzc3LjU0NTU2MXYtLjg4MTA4NTFjMC0uODY5MTU4OC0uOTExMzc3LTEuNDk0NjcxOS0xLjg5MjUwMy0xLjQ5NDY3MTktLjQ4NzQ3MiAwLS45NTc4NzQuMTUzNzUwNS0xLjMwODExMS40MTU2MjAydi0uMzcwNzQzOWMwLS44Njg2MzY5Mi0uOTA4NjctMS40OTYxNTMzOC0xLjg5MDczNDktMS40OTYxNTMzOHoiIGZpbGw9IiM5OTkiIHN0cm9rZS13aWR0aD0iMS4xNDg5NzkiLz48ZyBzdHJva2U9IiMwMDAiPjxwYXRoIGQ9Im0xMC4yOTEwMjkuMDYzMDMwNTJjLS45NjAwODQgMC0xLjg1MDAzNDYuNjEyODYwMjQtMS44NTAwMzQ2IDEuNDY0NDkzMzgtLjAwMDAwMjcuMDAwOTk2NS0uMDAwMDAyNy4wMDE5OSAwIC4wMDI5OWwuMDU2OTM3MSA3Ljk5NjM1MjEtLjkxMjkyMzEtMi4wNDczMzI1Yy0uMDI0NjQwMy0uMDU1OTMwNC0uMDU4NDQ4Ny0uMTA4ODg2Ni0uMTAwMTIxOS0uMTU2ODI3Mi0uMzU5MzQ3MS0uNDA5MDQwMS0uODMwNDcxLS42OTA1MDgxLTEuMzI1Mzk3NS0uNzYwMzMwMy0uNDk0OTI1Mi0uMDY5ODY4Ni0uOTAwODgyMi4wMjg5MjQ2LTEuMjkyNTkzNS4xMTI0MjU0LS41OTM5OTk1LjEyNjYyOC0uOTM0NzkxOS41NTc5NjQzLTEuMDY5OTgyNC45NjQ0OTQ5LS4xMjg1MDgyLjM4NjMxOTUtLjExMjEwNjQuODAzMjYzMy4wNjA0MTU4IDEuMjA3MDk3NWgtLjAwMTc2bDEuOTgyOTU5MiA1Ljk1MjY0ODJjLjAxNTk2OC4wNDgzOC4wMzg1OTYuMDk1MTYuMDY3MjY1LjEzOTAzMWwzLjMzMDc3NzIgNS4wNzI1MS44MDQxODY3IDIuMzE5NTIyYy4wOTIxMS4yNjQ2MjYuNDAyNjcuNDYxMDk5LjcyNDgyNS40NTg1NTJsNy42NDAwMzEtLjA1MzI2Yy4zMzg4NjYtLjAwMjguNjU3NzU4LS4yMjczNzYuNzI2NTQxLS41MTE4MDhsMi4wNzk2MDYtOC41NjgwMjhjLjAwMjYtLjAxMDMyLjAwNDktLjAyMDY5LjAwNjktLjAzMTEuMTAyODg1LS41NjEzMjMuMDY2MzItMS41MDQ5NDUuMDQxNDItMi40Nzc3Ny0uMDEyNDgtLjQ4NjQzNS0uMDI4MzMtLjk1NzQ0Mi0uMDM5NzEtMS4zMjI1MDUxLS4wMTEzOC0uMzY1MDY1My0uMDA4My0uNzA4NDAxMS0uMDEzOC0uNjQwNTIwMy4wMDExLS4wMTQ3NzguMDAxOC0uMDI5NTg5LjAwMTgtLjA0NDQwMXYtMi44NzEyODI2Yy4wMDAxNTktLjA0NjY5NS0uMDA1Ny0uMDkzNDA0LS4wMTcyOC0uMTM5MDIyMy0uMDkwNTU5LS4zNDk0NDU0LS4yMTcyNDQtLjY3ODM0NDctLjUwNzQ1NC0uOTY2MDExLS4yNjk3Mi0uMjY3MzYxNC0uNzQ1MzE2LS40MzU3Mzk3LTEuMTkyNTI1LS40MTQyMDE3di0uMDA1OTFjLS4wMjA0OSAwLS4wMzk5OC4wMDUyNS0uMDYwMzcuMDA1OTEtLjAxMzc1LjAwMTI0LS4wMjc4Mi0uMDAxNjEtLjA0MTQyIDB2LjAwNDQ1Yy0uMzEyMTI5LjAxNzE4NC0uNjA1NzYuMTA4NDUxMy0uODQ3MzcxLjI1MTQ1NTl2LS4xODkzNDgzYzAtLjg1MjExNjgtLjg5MTIxNy0xLjQ2NDQ3MDgtMS44NTE3NDYtMS40NjQ0NzA4aC0uMDA1MmMtLjU0ODA1MiAwLTEuMDY3MDU0LjIwNDQwMTktMS40MTY4NS41MzQwMTA5di0uODYyNDM1NGMwLS44NTA3NDQtLjg5MDk0Mi0xLjQ2MzAwMjYtMS44NTAwMzMtMS40NjMwMDI2LS40NzY1OTEgMC0uOTM2MzkzLjE1MDUzMTMtMS4yNzg4NDIuNDA2ODE1NnYtLjQzODY5N2MwLS44NTAyNDYxMi0uODg4MjM4LTEuNDY0NDkzNDEtMS44NDgyNjgtMS40NjQ0OTM0MXoiIHN0cm9rZS13aWR0aD0iLjAzNTMwMSIvPjxwYXRoIGQ9Im0xMC4yOTAyNTcuODA5NTk3MDNjLS42MDkyOTgzIDAtMS4xMDA0NjYzLjM2NjQzNzU3LTEuMTAwNDY2My44MjIxMDQxN2wuMDY1NTUgOS4zODE2NDU4Yy0uMDE3MTc0Ny4zODg4MjctLjY5MjE4ODIuNDU3NzQ5LS44MTk0MjU4LjE3MzMwMmwtMS41NDk0NDU0LTMuNDc3NDgzNWMtLjU3NzMyMDYtLjY1NzIyOTItMS4wNzAyMDMtLjU3NDkxMTEtMS44Mzc4Mjc5LS40MTEyNjU5LS41MjE2MDAxLjExMTI0MTgtLjczNzU4NDguODA5ODQ0Ni0uNDcyNjE1NCAxLjM3MjU0MWwxLjk4MTYzNDYgNS45NTI2OTc0IDMuMzcyMzA3NCA1LjEzNjEzLjgyOTI1NjggMi4zODc5NjkgNy42MzkwOTQtLjA1MzMgMi4wODA1OTgtOC41Njg4M2MuMTM3MDEyLS43NDcxNzMtLjA0MjQ3LTQuMDk2NzAxNi0uMDE5MzgtNC4zODY0MDY4di0yLjg3MDU3MjFjLS4xNTIxNDgtLjU4NzU0OTUtLjQzNzQ5NS0uOTQ2NzkwMS0uOTY5MDkxLS44ODM4ODA2LS42MTA0IDAtLjkyMzkxMS40MjgyMTI5LS45MjM5MTEuODgzODc5NXYyLjg0MTE3NThjLjEwNjUyOC4zODUxMzczLS44MTM2ODUuNDg1NDg5NC0uNzc0MzY0LS4wMDE5NHYtNC4yOTE0NDM3YzAtLjQ1NTY2NzktLjQ5MTc3Ny0uODIyNzY3Ny0xLjEwMjE3OS0uODIyNzY3N2gtLjAwNTJjLS42MTA0MDEgMC0xLjEwMTI5NS4zNjcwOTk4LTEuMTAxMjk1LjgyMjc2Nzd2My40NDY0Mjc5Yy4xMTEyMjEuNDE2NjE2My0xLjA5MDAzLjUzODQ2LTEuMDYzNDY3LS4wMDE5NHYtNS4yMzcyNDE2YzAtLjQ1NTY2NzYtLjQ5MTc3OS0uODIyMTUxMS0xLjEwMjE3OS0uODIyMTUxMS0uNjEwNDU2IDAtMS4xMDIyMzIuMzY2NDgzNS0xLjEwMjIzMi44MjIxNTExdjUuNTA1MTcxM2MuMDQ4MjcuMzgxOTE0OC0uOTAxMzgxLjQ3ODE1MTUtLjkyNTc5Mi0uMDAxMjl2LTYuODk1MzU0OGMwLS40NTU2NjY2LS40OTAyODYtLjgyMjEwMzgzLTEuMDk5NTgtLjgyMjEwMzgzeiIgZmlsbD0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIuMDE2NDI0Ii8+PC9nPjwvc3ZnPg==',
        mActionZoomFullExtent: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0xNy45NjEyMiA3YzAgMy4zNTQ3MTItMi42Njg5MjkgNi4wNzQyNDQtNS45NjEyMiA2LjA3NDI0NHMtNS45NjEyMjAzLTIuNzE5NTMyLTUuOTYxMjIwMy02LjA3NDI0NGMwLTMuMzU0NzEyMSAyLjY2ODkyOTMtNi4wNzQyNDM1NSA1Ljk2MTIyMDMtNi4wNzQyNDM1NXM1Ljk2MTIyIDIuNzE5NTMxNDUgNS45NjEyMiA2LjA3NDI0MzU1eiIgc3R5bGU9Im9wYWNpdHk6Ljg7ZmlsbDojZTZlNmU2O3N0cm9rZTojNTA1MDUwO3N0cm9rZS13aWR0aDouNzUyMTgzO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1kYXNob2Zmc2V0OjciIHRyYW5zZm9ybT0ibWF0cml4KDEuMzQyMDA3MSAwIDAgMS4zMTcwMzY1IC0xLjYwNDA4NSA4LjI3OTEwOSkiLz48cGF0aCBkPSJtMjMuNSAyNy45MThoLTcuNzc3ODMybDIuNTkyNjEtMi41OTI2MDktMi41OTI2MS0yLjU5MjYwOSAyLjU5MjYwNy0yLjU5MjYxIDIuNTkyNjEzIDIuNTkyNjEgMi41OTI2MDktMi41OTI2MXoiIGZpbGw9IiM2ZDk3YzQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNDE1YTc1Ii8+PHBhdGggZD0ibTcuNTAwMDAwMSAyMi41YzAgMiAyIDIgMiAycy03IDctNyA3bC0yLjAwMDAwMDAxLTJ6IiBmaWxsPSIjZmZjYzMwIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0iIzUwNTA1MCIvPjxwYXRoIGQ9Im02LjAwMDAwMDEgMjQgMi0yIDEuOTk5OTk5OSAyLTEuOTk5OTk5OSAyeiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48L2c+PHBhdGggZD0ibTEwIDEzYzItMyA0LjQ0MjI0OC0zLjM5ODA1NSA2LTJzLTIgMS00IDMgMCA2LTIgNmMtMS45OTk5OTk5IDAtMS45OTk5OTk5LTQgMC03eiIgZmlsbD0iI2ZjZmZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIuNyIvPjxwYXRoIGQ9Im0yLjAwMDAwMDEgMjkgNC00IiBvcGFjaXR5PSIuNSIgc3Ryb2tlPSIjZmNmZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cGF0aCBkPSJtMjMuNDk5OTk5IDguNS4wMDAwMDEgNy43Nzc4MzQtMi41OTI2MTItMi41OTI2MTQtMi41OTI2MSAyLjU5MjYxNC0yLjU5MjYxLTIuNTkyNjEyIDIuNTkyNjEtMi41OTI2MS0yLjU5MjYxLTIuNTkyNjExNHoiIGZpbGw9IiM2ZDk3YzQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNDE1YTc1IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0ibTQuMDgyIDguNWg3Ljc3NzgzMmwtMi41OTI2MTIgMi41OTI2MSAyLjU5MjYxMiAyLjU5MjYxLTIuNTkyNjExIDIuNTkyNjEtMi41OTI2MTA1LTIuNTkyNjEtMi41OTI2MTAyIDIuNTkyNjF6IiBmaWxsPSIjNmQ5N2M0IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0iIzQxNWE3NSIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvZz48L3N2Zz4=',
        mActionZoomIn: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxwYXRoIGQ9Im0xNy45NjEyMiA3YzAgMy4zNTQ3MTItMi42Njg5MjkgNi4wNzQyNDQtNS45NjEyMiA2LjA3NDI0NHMtNS45NjEyMjAzLTIuNzE5NTMyLTUuOTYxMjIwMy02LjA3NDI0NGMwLTMuMzU0NzEyMSAyLjY2ODkyOTMtNi4wNzQyNDM1NSA1Ljk2MTIyMDMtNi4wNzQyNDM1NXM1Ljk2MTIyIDIuNzE5NTMxNDUgNS45NjEyMiA2LjA3NDI0MzU1eiIgc3R5bGU9Im9wYWNpdHk6Ljg7ZmlsbDojZTZlNmU2O3N0cm9rZTojNTA1MDUwO3N0cm9rZS13aWR0aDouNzUyMTgzO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtZGFzaG9mZnNldDo3IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjM0MjAwNzEgMCAwIDEuMzE3MDM2NSAtMS42MDQwODUgOC4yNzkxMDkpIi8+PHBhdGggZD0ibTEwIDEzYzItMyA0LjQ0MjI0OC0zLjM5ODA1NSA2LTJzLTIgMS00IDMgMCA2LTIgNmMtMS45OTk5OTk5IDAtMS45OTk5OTk5LTQgMC03eiIgZmlsbD0iI2ZjZmZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIuNyIvPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0xNC41IDEzLjJ2OC42IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyLjkiLz48cGF0aCBkPSJtMi4wMDAwMDAxIDI5IDQtNCIgb3BhY2l0eT0iLjUiIHN0cm9rZT0iI2ZjZmZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PHBhdGggZD0ibTEwLjIgMTcuNWg4LjYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIuOSIvPjxwYXRoIGQ9Im0xMC4yIDE3LjVoOC42IiBmaWxsPSJub25lIiBzdHJva2U9IiM2ZDk3YzQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyLjUiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg4LjczNjAzMyA0LjkwNjQyNCkiPjxwYXRoIGQ9Im0tMS4yMzYwMzM0IDE3LjU5MzU3NmMwIDIgMi4wMDAwMDAwMSAyIDIuMDAwMDAwMDEgMnMtNy4wMDAwMDAwMSA3LTcuMDAwMDAwMDEgN2wtMi0yeiIgZmlsbD0iI2ZmY2MzMCIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48cGF0aCBkPSJtLTIuNzM2MDMzNCAxOS4wOTM1NzYgMi4wMDAwMDAwMS0yIDEuOTk5OTk5ODkgMi0xLjk5OTk5OTg5IDJ6IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIHN0cm9rZT0iIzUwNTA1MCIvPjxwYXRoIGQ9Im0tNi43MzYwMzM0IDI0LjA5MzU3NiA0LTQiIG9wYWNpdHk9Ii41IiBzdHJva2U9IiNmY2ZmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjwvZz48cGF0aCBkPSJtMTQuNSAxMy4ydjguNiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmQ5N2M0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PC9nPjwvZz48L3N2Zz4=',
        mActionZoomLast: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im03LjUwMDAwMDEgMjIuNWMwIDIgMiAyIDIgMnMtNyA3LTcgN2wtMi4wMDAwMDAwMS0yeiIgZmlsbD0iI2ZmY2MzMCIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48cGF0aCBkPSJtMTcuOTYxMjIgN2MwIDMuMzU0NzEyLTIuNjY4OTI5IDYuMDc0MjQ0LTUuOTYxMjIgNi4wNzQyNDRzLTUuOTYxMjIwMy0yLjcxOTUzMi01Ljk2MTIyMDMtNi4wNzQyNDRjMC0zLjM1NDcxMjEgMi42Njg5MjkzLTYuMDc0MjQzNTUgNS45NjEyMjAzLTYuMDc0MjQzNTVzNS45NjEyMiAyLjcxOTUzMTQ1IDUuOTYxMjIgNi4wNzQyNDM1NXoiIHN0eWxlPSJvcGFjaXR5Oi44O2ZpbGw6I2U2ZTZlNjtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6Ljc1MjE4MztzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtZGFzaG9mZnNldDo3IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjM0MjAwNzEgMCAwIDEuMzE3MDM2NSAtMS42MDQwODUgOC4yNzkxMDkpIi8+PHJlY3QgZmlsbD0iIzZkOTdjNCIgaGVpZ2h0PSIxMC44MDAwNjUiIHJ4PSIuOTgxODI0IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iLjQiIHdpZHRoPSIxMC44MDAwNjUiIHg9IjEyLjk5OTkzNSIgeT0iMjAuOTk5OTM1Ii8+PHBhdGggZD0ibTIxIDI5LjhjLTEuOC0yLTIuODkwNzgxLTEuOTcwMjEzLTUuMjAwMDMzLTMuNDAxODYzIDIuMjAwMDMzLTEuMzk4MTM3IDMuNDAwMDMzLTEuMTk4MTM3IDUuMjAwMDMzLTMuMzk4MTM3IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0ibTEwIDI0LTIgMi0yLTIgMi0yeiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48L2c+PHBhdGggZD0ibTEwIDEzYzItMyA0LjQ0MjI0OC0zLjM5ODA1NSA2LTJzLTIgMS00IDMgMCA2LTIgNmMtMS45OTk5OTk5IDAtMS45OTk5OTk5LTQgMC03eiIgZmlsbD0iI2ZjZmZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIuNyIvPjxwYXRoIGQ9Im0yLjAwMDAwMDEgMjkgNC00IiBvcGFjaXR5PSIuNSIgc3Ryb2tlPSIjZmNmZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cmVjdCBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xMiIgaGVpZ2h0PSI1LjE5OTk5OCIgcng9Ii44MTMyOCIgcnk9Ii43MTMiIHdpZHRoPSIxMC40IiB4PSIxMy4yIiB5PSIyMS4yMDAwMDEiLz48L2c+PC9zdmc+',
        mActionZoomNext: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im03LjUwMDAwMDEgMjIuNWMwIDIgMiAyIDIgMnMtNyA3LTcgN2wtMi4wMDAwMDAwMS0yeiIgZmlsbD0iI2ZmY2MzMCIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48cGF0aCBkPSJtMTcuOTYxMjIgN2MwIDMuMzU0NzEyLTIuNjY4OTI5IDYuMDc0MjQ0LTUuOTYxMjIgNi4wNzQyNDRzLTUuOTYxMjIwMy0yLjcxOTUzMi01Ljk2MTIyMDMtNi4wNzQyNDRjMC0zLjM1NDcxMjEgMi42Njg5MjkzLTYuMDc0MjQzNTUgNS45NjEyMjAzLTYuMDc0MjQzNTVzNS45NjEyMiAyLjcxOTUzMTQ1IDUuOTYxMjIgNi4wNzQyNDM1NXoiIHN0eWxlPSJvcGFjaXR5Oi44O2ZpbGw6I2U2ZTZlNjtzdHJva2U6IzUwNTA1MDtzdHJva2Utd2lkdGg6Ljc1MjE4MztzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtZGFzaG9mZnNldDo3IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjM0MjAwNzEgMCAwIDEuMzE3MDM2NSAtMS42MDQwODUgOC4yNzkxMDkpIi8+PGcgdHJhbnNmb3JtPSJtYXRyaXgoLTEgMCAwIC0xIDM2Ljc5OTkzNSA1Mi43OTk5MzUpIj48cmVjdCBmaWxsPSIjNmQ5N2M0IiBoZWlnaHQ9IjEwLjgwMDA2NSIgcng9Ii45ODE4MjQiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLXdpZHRoPSIuNCIgd2lkdGg9IjEwLjgwMDA2NSIgeD0iMTIuOTk5OTM1IiB5PSIyMC45OTk5MzUiLz48cGF0aCBkPSJtMjEgMjkuOGMtMS44LTItMi44OTA3ODEtMS45NzAyMTMtNS4yMDAwMzMtMy40MDE4NjMgMi4yMDAwMzMtMS4zOTgxMzcgMy40MDAwMzMtMS4xOTgxMzcgNS4yMDAwMzMtMy4zOTgxMzciIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiLz48L2c+PHBhdGggZD0ibTEwIDI0LTIgMi0yLTIgMi0yeiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48L2c+PHBhdGggZD0ibTEwIDEzYzItMyA0LjQ0MjI0OC0zLjM5ODA1NSA2LTJzLTIgMS00IDMgMCA2LTIgNmMtMS45OTk5OTk5IDAtMS45OTk5OTk5LTQgMC03eiIgZmlsbD0iI2ZjZmZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIuNyIvPjxwYXRoIGQ9Im0yLjAwMDAwMDEgMjkgNC00IiBvcGFjaXR5PSIuNSIgc3Ryb2tlPSIjZmNmZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48cmVjdCBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9Ii4xMiIgaGVpZ2h0PSI1LjE5OTk5OCIgcng9Ii44MTMyOCIgcnk9Ii43MTMiIHdpZHRoPSIxMC40IiB4PSIxMy4yIiB5PSIyMS4yMDAwMDEiLz48L2c+PC9zdmc+',
        mActionZoomOut: 'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjI0IiB3aWR0aD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtOCkiPjxwYXRoIGQ9Im0xNy45NjEyMiA3YzAgMy4zNTQ3MTItMi42Njg5MjkgNi4wNzQyNDQtNS45NjEyMiA2LjA3NDI0NHMtNS45NjEyMjAzLTIuNzE5NTMyLTUuOTYxMjIwMy02LjA3NDI0NGMwLTMuMzU0NzEyMSAyLjY2ODkyOTMtNi4wNzQyNDM1NSA1Ljk2MTIyMDMtNi4wNzQyNDM1NXM1Ljk2MTIyIDIuNzE5NTMxNDUgNS45NjEyMiA2LjA3NDI0MzU1eiIgc3R5bGU9Im9wYWNpdHk6Ljg7ZmlsbDojZTZlNmU2O3N0cm9rZTojNTA1MDUwO3N0cm9rZS13aWR0aDouNzUyMTgzO3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZDtzdHJva2UtZGFzaG9mZnNldDo3IiB0cmFuc2Zvcm09Im1hdHJpeCgxLjM0MjAwNzEgMCAwIDEuMzE3MDM2NSAtMS42MDQwODUgOC4yNzkxMDkpIi8+PHBhdGggZD0ibTEwIDEzYzItMyA0LjQ0MjI0OC0zLjM5ODA1NSA2LTJzLTIgMS00IDMgMCA2LTIgNmMtMS45OTk5OTk5IDAtMS45OTk5OTk5LTQgMC03eiIgZmlsbD0iI2ZjZmZmZiIgZmlsbC1ydWxlPSJldmVub2RkIiBvcGFjaXR5PSIuNyIvPjxnIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0yLjAwMDAwMDEgMjkgNC00IiBvcGFjaXR5PSIuNSIgc3Ryb2tlPSIjZmNmZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48cGF0aCBkPSJtMTAuNSAxNy41aDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2Utd2lkdGg9IjIuOSIvPjxwYXRoIGQ9Im0xMC41IDE3LjVoOCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNmQ5N2M0IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS13aWR0aD0iMi41Ii8+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOC43MzYwMzMgNC45MDY0MjQpIj48cGF0aCBkPSJtLTEuMjM2MDMzNCAxNy41OTM1NzZjMCAyIDIuMDAwMDAwMDEgMiAyLjAwMDAwMDAxIDJzLTcuMDAwMDAwMDEgNy03LjAwMDAwMDAxIDdsLTItMnoiIGZpbGw9IiNmZmNjMzAiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjNTA1MDUwIi8+PHBhdGggZD0ibS0yLjczNjAzMzQgMTkuMDkzNTc2IDIuMDAwMDAwMDEtMiAxLjk5OTk5OTg5IDItMS45OTk5OTk4OSAyeiIgZmlsbC1ydWxlPSJldmVub2RkIiBzdHJva2U9IiM1MDUwNTAiLz48cGF0aCBkPSJtLTYuNzM2MDMzNCAyNC4wOTM1NzYgNC00IiBvcGFjaXR5PSIuNSIgc3Ryb2tlPSIjZmNmZmZmIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L2c+PC9nPjwvZz48L3N2Zz4='
    };

    // Lizmap button selector -> QGIS icon (title used only if the button has none)
    const ICONS = [
        { sel: '#navbar button.pan',               icon: 'mActionPan',            title: 'Pan' },
        { sel: '#navbar button.zoom',              icon: 'mActionZoomToArea',     title: 'Zoom to area' },
        { sel: '#navbar button.zoom-extent',       icon: 'mActionZoomFullExtent', title: 'Zoom to full extent' },
        { sel: '#navbar button.zoom-in',           icon: 'mActionZoomIn',         title: 'Zoom in' },
        { sel: '#navbar button.zoom-out',          icon: 'mActionZoomOut',        title: 'Zoom out' },
        { sel: '#navbar .history button.previous', icon: 'mActionZoomLast',       title: 'Previous extent' },
        { sel: '#navbar .history button.next',     icon: 'mActionZoomNext',       title: 'Next extent' },
    ];

    function injectStyles() {
        // Always rewrite the style (in case an older version of the script created it)
        let style = document.getElementById('qgis-navbar-icons-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'qgis-navbar-icons-style';
        }
        style.textContent = `
            #navbar#navbar button.btn {
                background: #ffffff !important;
                border: 1px solid #c8c8c8 !important;
                border-radius: 4px !important;
                width: ${ICON_SIZE + 12}px !important;
                height: ${ICON_SIZE + 12}px !important;
                min-width: 0 !important;
                padding: 0 !important;
                margin: 2px 0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                overflow: hidden !important;
                font-size: 0 !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            }
            /* Override Lizmap / Bootstrap / jQuery UI styles on every state
               (repeated id and class = higher specificity than map.css) */
            #navbar#navbar button.btn.btn,
            #navbar#navbar button.btn.btn:focus,
            #navbar#navbar button.btn.btn:active,
            #navbar#navbar button.btn.btn.active,
            #navbar#navbar button.btn.btn.ui-state-active,
            #navbar#navbar button.btn.btn.ui-state-focus,
            #navbar#navbar button.btn.btn.ui-state-hover {
                background-color: #ffffff !important;
                background-image: none !important;
                border-color: #c8c8c8 !important;
                color: inherit !important;
                text-shadow: none !important;
                outline: none !important;
                filter: none !important;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
            }
            #navbar#navbar button.btn.btn:hover {
                background-color: #e8f1fb !important;
            }
            /* Active tool (pan / zoom to area) */
            #navbar#navbar button.btn.btn.active,
            #navbar#navbar button.btn.btn.active:focus,
            #navbar#navbar button.btn.btn.active:hover,
            #navbar#navbar button.btn.btn.ui-state-active {
                background-color: #cfe2f7 !important;
                border-color: #2b7cbd !important;
                box-shadow: inset 0 1px 3px rgba(0,0,0,0.25) !important;
            }
            #navbar#navbar button.btn.btn > img.qgis-img {
                filter: none !important;
                opacity: 1 !important;
            }
            #navbar#navbar button.btn > img.qgis-img {
                width: ${ICON_SIZE}px !important;
                height: ${ICON_SIZE}px !important;
                max-width: none !important;
                display: block !important;
                pointer-events: none;
            }
            #navbar {
                padding: 5px !important;
                border: 1px solid #c8c8c8 !important;
                background-color: white !important;
            }
            #navbar div.slider {
                margin-bottom: 15px;
                background: #fff !important;
                border: solid 1px #c8c8c8;
            }
            ${HIDE_SLIDER ? '#navbar .slider { display: none !important; }' : ''}

            /* Small screens: compact bar with the essential tools only */
            @media (max-width: ${MOBILE_BREAKPOINT}px) {
                #navbar#navbar button.btn {
                    width: ${MOBILE_ICON_SIZE + 8}px !important;
                    height: ${MOBILE_ICON_SIZE + 8}px !important;
                    margin: 1px 0 !important;
                }
                #navbar {
                    padding: 3px !important;
                    border: none !important;
                    background-color: transparent !important;
                }
                #navbar div.slider { margin-bottom: 8px; }
                #navbar#navbar button.btn > img.qgis-img {
                    width: ${MOBILE_ICON_SIZE}px !important;
                    height: ${MOBILE_ICON_SIZE}px !important;
                }
                ${MOBILE_HIDE.map((s) => s.replace('#navbar ', '#navbar#navbar#navbar ') + ' { display: none !important; }').join('\n                ')}
            }
        `;
        document.body.appendChild(style); // end of <body>: after map.css
    }

    function applyIcons() {
        let n = 0;
        ICONS.forEach(({ sel, icon, title }) => {
            document.querySelectorAll(sel).forEach((btn) => {
                if (btn.querySelector('img.qgis-img')) return;
                btn.innerHTML = '';
                const img = document.createElement('img');
                img.className = 'qgis-img';
                img.src = SVG[icon];
                img.alt = '';
                btn.appendChild(img);
                if (!btn.title) btn.title = title;
                n++;
            });
        });
        if (n) console.log(TAG, `icons applied on ${n} buttons.`);
    }

    function run() { injectStyles(); applyIcons(); }

    // If Lizmap re-renders the navbar content, apply the icons again
    const obs = new MutationObserver(() => applyIcons());
    const watch = () => {
        const nb = document.getElementById('navbar');
        if (nb) obs.observe(nb, { childList: true, subtree: true });
    };

    if (typeof lizMap !== 'undefined' && lizMap.events) {
        lizMap.events.on({ uicreated: function () { run(); watch(); } });
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => { run(); watch(); });
    } else {
        run();
        watch();
    }
})();
