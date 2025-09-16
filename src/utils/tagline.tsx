import { useEffect, useState } from "react";

export const taglines: string[] = [
  'Explore probabilities with nodes and Monte Carlo simulations.',
  'Probabilities? Who is she?',
  'Who\'s counting?',
  'Simulate your way to certainty.',
  'Where chance meets choice.',
  'Visualize the unpredictable.',
  'From nodes to knowledge.',
  'Chart your course through uncertainty.',
  'Making sense of randomness, one node at a time.',
  'Dive into the world of probabilities.',
  'Your journey through chance starts here.',
  'Connecting dots, revealing odds.',
  'Simulate. Analyze. Understand.',
  'Should I ask her out? Run the simulation!',
  'Life is a series of probabilities. Explore them.',
  'Turn uncertainty into insight.',
  'The art of predicting the unpredictable.',
  'Where data meets destiny.',
  'Unlock the power of probabilistic thinking.',
  'From chaos to clarity with every simulation.',
  'Discover the hidden patterns of chance.',
  'Your personal probability playground.',
  'Simulate scenarios, shape decisions.',
  'Visualize outcomes, embrace uncertainty.',
  'The future is uncertain. Simulate it anyway.',
  'Navigate the maze of probabilities with ease.',
  'Midlife crisis simulator included.',
  'Midlife crisis calculator',
  'Because life is too short for bad guesses.',
  'Yea, i know, I should ask her out. Let me run the simulation.',
  'Probably having a midlife crisis. Let me run the simulation.',
  'Bae? Nah, I prefer bayes.',
  'Don\'t take chances, run the simulation.',
  'Simulate your way to a better decision.',
  'In a world of uncertainty, be the simulator.',
  'Life is a gamble. Play it smart.',
  'When in doubt, simulate it out.',
  'The only certainty is uncertainty. Embrace it.',
  'Simulate the possibilities, master the probabilities.',
  'Your odds just got better.',
  'From random to reasoned decisions.',
  'The science of chance, at your fingertips.',
  'Where every node tells a story of chance.',
  'Simulate smarter, not harder.',
  'Because guessing is so last century.',
  'The future is a simulation away.',
  'Unlock the secrets of probability with every node.',
  'Your chance to make better choices starts here.',
  'Simulate the future, today.',
  'Where probability meets possibility.',
  'Take control of chance with simulations.',
  'The ultimate tool for probabilistic thinking.',
  'From uncertainty to understanding, one simulation at a time.',
  'Because life is too important to leave to chance.',
  'Simulate the outcomes, choose your path.',
  'Where data drives decisions, and simulations reveal truths.',
  'The power of probability, in your hands.',
  'Simulate the scenarios, shape your destiny.',
  'Your journey through chance begins here.',
  'From nodes to knowledge, with every simulation.',
  'Visualize the unpredictable, embrace the uncertain.',
  'Making sense of randomness, one node at a time.',
  'Explore the world of probabilities, one simulation at a time.',
  'Chart your course through uncertainty with simulations.',
  'Unlock the power of probabilistic thinking with every node.',
  'From chaos to clarity, with every simulation run.',
  'Discover the hidden patterns of chance with simulations.',
  'Don\'t take chances, know the odds with simulations.',
  'Series of improbable events',
];

export function getRandomTagline(): string {
  const index = Math.floor(Math.random() * taglines.length);
  return taglines[index];
}

export const Tagline: React.FC = () => {
  const [tagline, setTagline] = useState(getRandomTagline());

  useEffect(() => {
    const interval = setInterval(() => {
      setTagline(getRandomTagline());
    }, 10000); // Change tagline every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return <p className='italic block min-h-[3rem]'>{tagline}</p>
};
