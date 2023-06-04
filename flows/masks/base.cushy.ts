action('A. mask-clothes', {
    help: 'extract a mak for the given clothes', // <- action help text
    // vv action require an image and an input text with tag 'clothes'
    // requirement: (kk) => ({
    //     image: kk.IMAGE({}),
    //     clothes: kk.STRING({ tag: 'clothes' }),
    // }),
    ui: (form) => ({
        match: form.str({ default: 'dress' }),
        image: form.selectImage('test', []),
    }),
    run: (flow, reqs) => {
        const image = reqs.image
        const clothesMask = flow.nodes.MasqueradeMaskByText({
            image: image,
            prompt: reqs.match,
            negative_prompt: 'face, arms, hands, legs, feet, background',
            normalize: 'no',
            precision: 0.3,
        })
        flow.nodes.PreviewImage({ images: clothesMask.IMAGE })
    },
})

action('B. auto-mask-face', {
    help: 'extract a mak for the face', // <- action help text
    // requirement: (kk) => ({
    //     image: kk.IMAGE({}),
    // }),
    run: (flow, deps) => {
        const clothesMask = flow.nodes.MasqueradeMaskByText({
            image: deps.image,
            prompt: 'face',
            negative_prompt: 'face, arms, hands, legs, feet, background',
            normalize: 'no',
            precision: 0.3,
        })
        flow.nodes.PreviewImage({ images: clothesMask.IMAGE })
    },
})
