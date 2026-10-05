window.MadeInItaly = {
  toggle({
    index, active, otherThemes, previous, state, targets = [],
    textField = 'desc', presetField = 'descPreset', descriptionMode = false, onChange
  }) {
    const next = !active[index];
    if (next) {
      if (previous) {
        previous[index] = {
          withDesc: state.withDesc,
          texts: targets.map(target => ({
            text: target[textField],
            preset: target[presetField]
          }))
        };
      }
      otherThemes.forEach(theme => { theme[index] = false; });
      if (descriptionMode) state.withDesc = true;
      targets.forEach(target => {
        target[textField] = 'Made in Italy';
        target[presetField] = 'Made in Italy';
      });
    } else if (previous && previous[index]) {
      const saved = previous[index];
      if (descriptionMode) state.withDesc = saved.withDesc;
      targets.forEach((target, position) => {
        target[textField] = saved.texts[position].text;
        target[presetField] = saved.texts[position].preset;
      });
      previous[index] = null;
    }
    active[index] = next;
    onChange();
  }
};
