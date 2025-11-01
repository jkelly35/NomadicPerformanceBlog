// src/lib/exercise-api.ts
interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  equipment: string;
  target: string;
  gifUrl: string;
  instructions: string[];
}

export async function searchExercises(bodyPart?: string, equipment?: string): Promise<Exercise[]> {
  let url = 'https://exercisedb.p.rapidapi.com/exercises';

  if (bodyPart) {
    url = `https://exercisedb.p.rapidapi.com/exercises/bodyPart/${bodyPart}`;
  } else if (equipment) {
    url = `https://exercisedb.p.rapidapi.com/exercises/equipment/${equipment}`;
  }

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
    } as HeadersInit
  });

  if (!response.ok) {
    throw new Error('Exercise data unavailable');
  }

  const data = await response.json();

  return data.slice(0, 10).map((exercise: any) => ({
    id: exercise.id,
    name: exercise.name,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: exercise.target,
    gifUrl: exercise.gifUrl,
    instructions: exercise.instructions
  }));
}

export async function getExerciseById(id: string): Promise<Exercise> {
  const response = await fetch(`https://exercisedb.p.rapidapi.com/exercises/exercise/${id}`, {
    headers: {
      'X-RapidAPI-Key': process.env.NEXT_PUBLIC_RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com'
    } as HeadersInit
  });

  if (!response.ok) {
    throw new Error('Exercise not found');
  }

  const exercise = await response.json();

  return {
    id: exercise.id,
    name: exercise.name,
    bodyPart: exercise.bodyPart,
    equipment: exercise.equipment,
    target: exercise.target,
    gifUrl: exercise.gifUrl,
    instructions: exercise.instructions
  };
}

// Alternative: Wger Workout Manager (completely free, no API key)
export async function getWgerExercises(limit = 20): Promise<Exercise[]> {
  const response = await fetch(`https://wger.de/api/v2/exercise/?limit=${limit}&language=2`);

  if (!response.ok) {
    throw new Error('Wger API unavailable');
  }

  const data = await response.json();

  return data.results.map((exercise: any) => ({
    id: exercise.id.toString(),
    name: exercise.name,
    bodyPart: exercise.category?.name || 'Unknown',
    equipment: exercise.equipment?.map((e: any) => e.name).join(', ') || 'Bodyweight',
    target: exercise.muscles?.map((m: any) => m.name).join(', ') || 'Full Body',
    gifUrl: '', // Wger doesn't provide GIFs
    instructions: exercise.description ? [exercise.description.replace(/<[^>]*>/g, '')] : []
  }));
}
