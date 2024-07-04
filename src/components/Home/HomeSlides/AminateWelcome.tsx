"use client";

import React, { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

function AminateWelcome() {
  const [init, setInit] = useState(false);
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
        fullScreen: false,
      //   background: {
      //     image: "linear-gradient(19deg, #21D4FD 0%, #B721FF 100%)",
      //     // color: {
      //     //   value: "#0d47a1",
      //     // },
      //   },
      fpsLimit: 120,
      interactivity: {
        events: {
          // onDiv: {
          //   enable: false,
          //   mode: "repulse",
          // },
          // onClick: {
          //   enable: true,
          //   mode: "repulse",
          // },
          onHover: {
            enable: true,
            mode: "repulse",
          },
        },
        modes: {
          push: {
            quantity: 4,
          },
          repulse: {
            distance: 200,
            duration: 0.4,
          },
        },
      },
      particles: {
        color: {
          value: "#4338ca",
        },
        // links: {
        //   color: "red",
        //   distance: 1000,
        //   enable: true,
        //   opacity: 0.5,
        //   width: 10,
        // },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.out,
          },
          random: true,
          speed: 3,
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 20,
        },
        opacity: {
          value: 0.3,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 25 },
        },
      },
      detectRetina: true,
    }),
    []
  );

  if (init)
    return (
      <Particles
        id="welcome-particles"
        options={options}
        className="overflow-hidden inset-0 absolute z-[1]"
      />
    );

  return <></>;
}

export default AminateWelcome;