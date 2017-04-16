# homebridge-timer
A timer component that exposes two motion sensors and a lightbulb that can start the timer.

First and foremost, the timer on this is pretty slick. Just turn on the the lightbulb and
watch the brightness decrease as the timer goes. The "start" motion sensor goes off at the
beginning of a timer and the "end" motion sensor goes off at the end of the timer.

The "time of day" functionality is NOT yet implemented. Should be trivial, but I wanted to get this out the door...

Your config for this should look like:

```json
{
    // Other stuff
    "platforms": [
        {
            "platform"  : "Timer",
            "timers": [
                {
                    "name": "Front Porch Light",
                    "seconds": 30,
                    "active": {
                        "start": "22:00",
                        "end": "06:00"
                    }
                }
            ]
        }
    ]
}
```

To run this in dev mode, first install babel, then do:

```bash
npm install
npm run build     # in its own terminal
homebridge -D -P /path/to/this/plugin
```
