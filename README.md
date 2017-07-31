# No longer needed
This package is no longer needed. Its functionality is built in to iOS11.

# homebridge-timer
A timer component that exposes two motion sensors and a lightbulb that can start the timer.

First and foremost, the timer on this is pretty slick. Just turn on the the lightbulb and
watch the brightness decrease as the timer goes. The "start" motion sensor goes off at the
beginning of a timer and the "end" motion sensor goes off at the end of the timer.

The "active" time of day field describes when the motion sensors added by each timer can 
possibly go active. The times defined are **inclusive** and so with the below config, the 
motion sensors will activate between the hours of 10 PM and 6 AM. Outside of those hours, 
the timer will still count down, but the motion sensors will not active, allowing your 
automations to not have to take this into account. The library will automatically figure out 
whether the time period spans across two days. Not including the active field will just default
to always being active.

Your config for this should look like:

```json
{
    "platforms": [
        {
            "platform"  : "Timer",
            "timers": [
                {
                    "name": "Front Porch Light",
                    "seconds": 300,
                    "active": {
                        "start": "22:00",
                        "end": "06:00"
                    }
                },
                {
                    "name": "Sprinkler Zone 1",
                    "seconds": 600
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
