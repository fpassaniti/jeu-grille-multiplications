import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase avec les variables d'environnement serveur
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY; // Clé de service plus sécurisée

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const {
      name,
      score,
      duration,
      level,
      solvedCells,
      totalPossibleCells,
      selectedTables
    } = await request.json();

    // Validation des données
    if (!name || !score || !duration || !level) {
      return json({ error: 'Informations manquantes' }, { status: 400 });
    }

    // Vérifications de sécurité pour éviter la triche

    // 1. Vérification du score maximum possible
    // Le score est basé sur les secondes restantes pour chaque question
    // Donc le score maximum ne peut pas dépasser la durée totale * 60 secondes
    const maxPossibleScore = duration * 60;
    if (score > maxPossibleScore) {
      return json({
        error: 'Score invalide: dépasse le maximum théorique'
      }, { status: 400 });
    }

    // 2. Vérification cohérence avec les cellules résolues
    // En moyenne, une cellule vaut environ la moitié du timer maximum
    // (disons 7-8 points par cellule pour un adulte, 20-25 pour un enfant)
    const avgPointsPerCell = level === 'adulte' ? 10 : 25;
    const estimatedMaxScore = solvedCells * avgPointsPerCell * 1.5; // Ajout d'une marge de 50%

    if (score > estimatedMaxScore && solvedCells > 0) {
      return json({
        error: 'Score trop élevé par rapport au nombre de cellules résolues'
      }, { status: 400 });
    }

    // 3. Vérification que les cellules résolues ne dépassent pas le maximum possible
    if (solvedCells > totalPossibleCells) {
      return json({
        error: 'Nombre de cellules résolues invalide'
      }, { status: 400 });
    }

    // Après toutes les vérifications, sauvegarder le score
    const supabase = createClient(supabaseUrl, supabaseKey);

    const newScore = {
      name: name.trim(),
      score,
      duration,
      level,
      cells_solved: solvedCells,
      total_cells: totalPossibleCells,
      tables_used: level === 'enfant' ? selectedTables : [],
      date: new Date().toISOString()
    };

    const { data, error: supabaseError } = await supabase
      .from('scores')
      .insert([newScore])
      .select();

    if (supabaseError) throw supabaseError;

    return json({
      success: true,
      message: 'Score enregistré avec succès',
      data
    });

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du score:', error);

    return json({
      error: 'Erreur serveur lors de l\'enregistrement du score'
    }, { status: 500 });
  }
}