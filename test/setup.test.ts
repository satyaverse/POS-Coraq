describe('test harness', () => {
  it('loads jsdom and jest-dom matchers', () => {
    const element = document.createElement('div');
    element.textContent = 'Coraq POS';
    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Coraq POS');
  });
});
