/* SCANORY MOONLIT — V5 CREATIVE PROTOTYPE — SAMPLE DATA.
   Fictional demo content (Ana and Nikola) and Unsplash stock photographs.
   The presentation reads only these fields; nothing about a customer is hard-coded
   in index.html or experience.js. See README.md for every field. */
window.SCANORY_V5 = {
  sample: true,
  recipient: 'Ana',
  sender: 'Nikola',
  scenes: {
    // Scene 1 — Open the gift
    gift: {
      enabled: true,
      address: 'For Ana',          // written on the envelope; default "For " + recipient
      monogram: 'A',               // pressed into the wax seal; default first letter of recipient
      greeting: 'Ana,',            // first line of the card; default recipient + ","
      message: 'I made you something. It’s a bit sentimental, so be nice.',
      signature: 'Nikola'          // default sender
    },
    // Scene 2 — Our first memory
    firstMemory: {
      enabled: true,
      image: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1400&auto=format&fit=crop&q=80',
      imageAlt: 'The two of us on the day we got lost',
      date: '2022-02-14',          // YYYY-MM-DD
      dateStamp: true,             // orange film-camera date in the corner of the photo
      caption: 'The wrong garden.',// handwritten on the white border
      line: 'The day we got completely lost.',
      thought: 'I saw the café the first time we walked past it. I just didn’t want the walk to end.'
    },
    // Scene 3 — Turn the photo over
    photoBack: {
      enabled: true,
      image: 'https://images.unsplash.com/photo-1501901609772-df0848060b33?w=1400&auto=format&fit=crop&q=80',
      imageAlt: 'An ordinary afternoon together',
      line: 'Turn it over.',
      greeting: 'Ana,',
      dedication: 'Nothing happened that day. We walked, we ate too much, you fell asleep on my shoulder on the way home. I think about it all the time.',
      date: '2024-03-03',          // written in pencil in the corner of the back
      signature: 'Nikola'
    },

    /* ---- V5.1: scenes 4 to 10. Every field is optional; empty fields hide their part. ---- */

    // Scene 4 — Our little universe: a counter in the sky and one star per memory.
    universe: {
      enabled: true,
      since: '2022-02-14T19:30:00+01:00', // full ISO date-time with offset; missing or future hides the counter
      line: 'Our little universe.',
      stars: [                     // 0 to 7 stars; none means a quiet sky with the counter only
        { date: 'February 2022', title: 'The wrong garden', text: 'Where it started.' },
        { date: 'May 2022', title: 'That rainy Tuesday', text: 'An hour under the awning of a closed bookstore.', note: 'I still walk past it on purpose.' },
        { date: 'August 2023', title: 'Lost in Rome', text: 'Ninety seconds late for the last train. Cold pizza on the curb.', note: 'Best night of the whole trip.' },
        { date: 'October 2024', title: 'The first keys', text: 'Two forks, one box of takeout, no furniture.', note: 'It already felt like home.' }
      ]
    },

    // Scene 5 — Our little archive: a pile of prints.
    archive: {
      enabled: true,
      line: 'Our little archive.',
      photos: [                    // any number; none hides the scene
        { src: 'https://images.unsplash.com/photo-1513279922550-250c2129b13a?w=1000&auto=format&fit=crop&q=80', alt: 'Evening by the water', caption: 'That evening by the water' },
        { src: 'https://images.unsplash.com/photo-1634268014879-ec7b2c982c5b?w=1000&auto=format&fit=crop&q=80', alt: 'Making a heart with our hands', caption: 'You made me do the heart thing', note: 'I complained the whole time. It’s my favourite photo of us.' },
        { src: 'https://images.unsplash.com/photo-1508407576665-2d9a5d638a7e?w=1000&auto=format&fit=crop&q=80', alt: 'A place we did not want to leave', caption: 'Somewhere I didn’t want to leave' },
        { src: 'https://images.unsplash.com/photo-1561132667-ab2a54ebf2dc?w=1000&auto=format&fit=crop&q=80', alt: 'Our table by the window', caption: 'Our table by the window', note: 'We stayed until they started stacking the chairs. Again.' },
        { src: 'https://images.unsplash.com/photo-1671116302821-d6fc9a003505?w=1000&auto=format&fit=crop&q=80', alt: 'Holding hands', caption: 'Holding on a little longer' }
      ]
    },

    // Scene 6 — Something about you: draw a heart, read three things.
    about: {
      enabled: true,
      line: 'Draw me a heart.',
      prompt: 'With your finger. It doesn’t have to be good.',
      reasons: [                   // up to three; none hides the scene
        { title: 'You remember the small things', text: 'How people take their coffee. The thing I mentioned once, three months ago. You never make a fuss about it.' },
        { title: 'The day the umbrella gave up', text: 'You stood there soaked, laughing so hard you couldn’t breathe, and a terrible day stopped being terrible.' },
        { title: 'How you say my name on bad days', text: 'A little softer, a little slower. Somehow I’m already home.' }
      ]
    },

    // Scene 7 — The sound of us. audio must be a recording you own or have licensed.
    song: {
      enabled: true,
      line: 'The sound of us.',
      title: 'The one from the kitchen',
      artist: '',
      dedication: 'You hummed it while burning the pasta, the first night at my place. I knew I was done for.',
      audio: ''                    // empty: no player is shown, only the dedication
    },

    // Scene 8 — The secret I kept: dust over a photograph and a message.
    secret: {
      enabled: true,
      line: 'The secret I kept.',
      image: 'https://images.unsplash.com/photo-1563808599481-34a342e44508?w=1200&auto=format&fit=crop&q=80',
      imageAlt: 'You, not looking at the camera',
      message: 'I took this when you weren’t looking. It’s still my favourite photo of you.'
    },

    // Scene 9 — The letter. DEMO ONLY: real private or date-locked letters must never be
    // shipped in a public static file; a server must deliver them after authentication.
    letter: {
      enabled: true,
      date: '2025-02-14',
      locked: null,                // e.g. { label: 'Open on 14 February 2026' } shows a sealed envelope and no text
      body: 'Ana,\n\nI started this letter four times. The first three were far too serious and you would have laughed at me, so this is the honest version.\n\nI love who you are on ordinary days. The one who sings in the shower and gets every second word wrong. The one who sends me photos of strange dogs in the middle of my workday. The one who always saves me the last bite, even when you pretend you won’t.\n\nI love that we can sit in the same room for an hour without saying anything, and it still feels like the best conversation of my day.\n\nThank you for every wrong turn that turned out right. For the garden we weren’t invited to, for Rome, for the bookstore, for the floor of our empty living room.\n\nI don’t need every day to be extraordinary. I just want to keep spending them with you.',
      signature: 'Always,\nNikola',
      postscript: 'P.S. Don’t close this yet.'
    },

    // Scene 10 — One last thing.
    finale: {
      enabled: true,
      message: 'Thank you for all the ordinary days. They’re my favourite thing we’ve made together.',
      // Shown only from 23:00 to 03:59 on the reader's own clock, after the final reveal.
      goodnight: 'It’s late. Go to sleep. I’ll still be here in the morning.'
    }
  }
};
