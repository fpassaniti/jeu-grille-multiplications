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
    // Avec le nouveau système de score qui utilise des multiplicateurs de difficulté,
    // le score maximum peut être plus élevé. On utilise un multiplicateur max de 3.0 pour la sécurité.
    // Note: duration est en minutes, donc on convertit en secondes (60 secondes par minute)
    const maxTimePerCell = level === 'adulte' ? 15 : 45; // Valeurs maximales du timer par cellule
    const maxMultiplier = 3.0; // Le multiplicateur maximum dans notre matrice de difficulté
    const maxPossibleScore = duration * 60 * 3.0 * maxTimePerCell * maxMultiplier; // Total max de points possibles
    if (score > maxPossibleScore) {
      return json({
        error: 'Score invalide: dépasse le maximum théorique'
      }, { status: 400 });
    }

    // 2. Vérification cohérence avec les cellules résolues
    // Pour chaque cellule, on donne une estimation généreuse
    // Temps max par cellule (en secondes) × multiplicateur max × facteur de sécurité
    const safetyFactor = 1.2; // Marge de sécurité
    const estimatedMaxScore = solvedCells * maxTimePerCell * maxMultiplier * safetyFactor;

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