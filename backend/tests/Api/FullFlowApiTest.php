<?php

declare(strict_types=1);

namespace App\Tests\Api;

/**
 * Test d'intégration end-to-end du flux complet :
 * création de joueurs → session → donnes → scores cumulés → smart-create → édition.
 */
class FullFlowApiTest extends ApiTestCase
{
    public function testFullFlow(): void
    {
        // Garder le même kernel entre les requêtes pour éviter la perte de contexte EM.
        $this->client->disableReboot();

        // 1. Créer 5 joueurs
        $playerIris = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $response = $this->client->request('POST', '/api/players', [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => ['name' => $name],
            ]);
            $this->assertResponseStatusCodeSame(201);
            $playerIris[$name] = $response->toArray()['@id'];
        }

        // 2. Créer une session
        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => \array_values($playerIris)],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $sessionData = $response->toArray();
        $sessionIri = $sessionData['@id'];
        $sessionId = $sessionData['id'];

        // 3. Créer la donne 1 (step 1 : preneur + contrat)
        $response = $this->client->request('POST', $sessionIri.'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $playerIris['Alice'],
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $game1Data = $response->toArray();
        $game1Iri = $game1Data['@id'];
        $this->assertSame(1, $game1Data['position']);
        $this->assertSame('in_progress', $game1Data['status']);

        // 4. Compléter la donne 1 (step 2)
        // Petite, 2 oudlers, 45 pts → base=29, preneur×2=58, partenaire=29, défenseurs=-29
        $response = $this->client->request('PATCH', $game1Iri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $playerIris['Bob'],
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();
        $game1Completed = $response->toArray();
        $this->assertSame('completed', $game1Completed['status']);
        $this->assertCount(5, $game1Completed['scoreEntries']);

        // 5. Vérifier les scores cumulés via GET session detail
        $response = $this->client->request('GET', $sessionIri);
        $this->assertResponseIsSuccessful();
        $sessionDetail = $response->toArray();
        $this->assertCount(5, $sessionDetail['cumulativeScores']);

        $scoresByName = [];
        foreach ($sessionDetail['cumulativeScores'] as $entry) {
            $scoresByName[$entry['playerName']] = $entry['score'];
        }
        $this->assertSame(58, $scoresByName['Alice']);
        $this->assertSame(29, $scoresByName['Bob']);
        $this->assertSame(-29, $scoresByName['Charlie']);
        $this->assertSame(-29, $scoresByName['Diana']);
        $this->assertSame(-29, $scoresByName['Eve']);

        // 6. Deuxième donne : créer + compléter
        $response = $this->client->request('POST', $sessionIri.'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'garde',
                'taker' => $playerIris['Charlie'],
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $game2Data = $response->toArray();
        $game2Iri = $game2Data['@id'];
        $this->assertSame(2, $game2Data['position']);

        // Garde, 1 oudler, 60 pts → base=(60-51+25)×2=68, preneur×2=136, partenaire=68, défenseurs=-68
        $response = $this->client->request('PATCH', $game2Iri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 1,
                'partner' => $playerIris['Diana'],
                'points' => 60,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertSame('completed', $response->toArray()['status']);

        // 7. Vérifier que les 2 donnes existent
        $response = $this->client->request('GET', $sessionIri.'/games');
        $gamesData = $response->toArray();
        $this->assertSame(2, $gamesData['totalItems'], 'Should have 2 games');

        // Vérifier les scores cumulés mis à jour
        $response = $this->client->request('GET', $sessionIri);
        $sessionDetail2 = $response->toArray();
        $scoresByName2 = [];
        foreach ($sessionDetail2['cumulativeScores'] as $entry) {
            $scoresByName2[$entry['playerName']] = $entry['score'];
        }
        // Alice: 58 + (-68) = -10
        $this->assertSame(-10, $scoresByName2['Alice']);
        // Bob: 29 + (-68) = -39
        $this->assertSame(-39, $scoresByName2['Bob']);
        // Charlie: -29 + 136 = 107
        $this->assertSame(107, $scoresByName2['Charlie']);
        // Diana: -29 + 68 = 39
        $this->assertSame(39, $scoresByName2['Diana']);
        // Eve: -29 + (-68) = -97
        $this->assertSame(-97, $scoresByName2['Eve']);

        // 8. Smart-create : POST la même session → retourne la même
        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => \array_values($playerIris)],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertSame($sessionId, $response->toArray()['id']);

        // 9. Éditer la dernière donne → recalcul des scores
        // Modifier les points de la donne 2 : 60 → 70
        // Garde, 1 oudler, 70 pts → base=(70-51+25)×2=88
        $response = $this->client->request('PATCH', $game2Iri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['points' => 70],
        ]);
        $this->assertResponseIsSuccessful();

        // Vérifier les scores recalculés
        $response = $this->client->request('GET', $sessionIri);
        $sessionDetail3 = $response->toArray();
        $scoresByName3 = [];
        foreach ($sessionDetail3['cumulativeScores'] as $entry) {
            $scoresByName3[$entry['playerName']] = $entry['score'];
        }
        // Donne 1: base=29 → Alice=58, Bob=29, C/D/E=-29
        // Donne 2 modifiée: base=88 → Charlie=176, Diana=88, Alice/Bob/Eve=-88
        // Alice: 58 + (-88) = -30
        $this->assertSame(-30, $scoresByName3['Alice']);
        // Charlie: -29 + 176 = 147
        $this->assertSame(147, $scoresByName3['Charlie']);
    }
}
