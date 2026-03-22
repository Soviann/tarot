# Codebase Patterns — Tarot

Reference for implementing without exploring. Jump straight to editing.

## Backend (`backend/`)

| Category | Path | Files |
|---|---|---|
| Entities | `src/Entity/` | `Player`, `Session`, `Game`, `ScoreEntry`, `StarEvent`, `EloHistory`, `PlayerGroup`, `PlayerBadge` |
| Repositories | `src/Repository/` | `GameRepository`, `ScoreEntryRepository`, `SessionRepository`, `StarEventRepository`, `EloHistoryRepository`, `PlayerRepository`, `PlayerGroupRepository`, `PlayerBadgeRepository`, `GroupFilterTrait` |
| Enums | `src/Enum/` | `Contract`, `Poignee`, `Side`, `Chelem`, `GameStatus`, `BadgeType` |
| DTOs | `src/Dto/` | `BadgeDto`, `DateRange`, `HeadToHeadGlobalPlayerDto`, `HeadToHeadPlayerDto`, `NewBadgesDto`, `BestSessionTotalDto`, `ContractCountByPlayerDto`, `ContractDistributionDto`, `ContractWinsByPlayerDto`, `ContractWinsDto`, `CumulativeScoreDto`, `EloHistoryPointDto`, `EloRankingEntryDto`, `GameTakerScoreDto`, `GamesPlayedCountDto`, `LeaderboardScoreDto`, `PlayerBadgeUnlockDto`, `PlayerCountDto`, `PlayerEloHistoryPointDto`, `PlayerExtremeScoreDto`, `PlayerScoreSumDto`, `PlayerWithCountDto`, `RecentScoreDto`, `ScoreEntryPositionDto`, `TakerGameDetailDto`, `TakerGameHighlightDto`, `TakerGameRecordDto`, `TotalTakerScoreDto` |
| State processors | `src/State/` | `GameCreateProcessor`, `GameCompleteProcessor`, `GameDeleteProcessor`, `SessionCreateProcessor`, `SessionCollectionProvider`, `SessionDetailProvider`, `SessionPatchProcessor`, `StarEventCreateProcessor`, `EloRevertHelper` |
| Event listeners | `src/EventListener/` | `RateLimitListener` |
| Validators | `src/Validator/` | `DealerBelongsToSession[Validator]`, `OnlyLastGameEditable[Validator]`, `PlayerOrderMatchesSession[Validator]`, `PlayersBelongToSession[Validator]` |
| Services (scoring) | `src/Service/Scoring/` | `ScoreCalculator`, `EloCalculator` |
| Services | `src/Service/` | `GlobalStatisticsService`, `HeadToHeadService`, `PlayerStatisticsService`, `SessionSummaryService`, `BadgeChecker`, `BadgeCheckContext` |
| Controllers | `src/Controller/` | `StatisticsController` (`/api/statistics`), `SessionController` (summary + group close), `KonamiController` (`POST /api/players/{id}/konami`) |
| Tests API | `tests/Api/` | `ApiTestCase` (base), `*ApiTest` per entity |
| Tests Unit | `tests/Unit/` | `Entity/SessionTest`, `Validator/PlayerOrderMatchesSessionValidatorTest`, `State/EloRevertHelperTest`, `State/Game{Create,Complete,Delete}ProcessorTest`, `State/Session{CollectionProvider,Create,DetailProvider,Patch}ProcessorTest`, `State/StarEventCreateProcessorTest` |
| Tests Service | `tests/Service/` | `ScoreCalculatorTest`, `EloCalculatorTest`, `BadgeCheckerTest`, `HeadToHeadServiceTest`, `SessionSummaryServiceTest`, `GlobalStatisticsServiceTest` |
| Tests Repo | `tests/Repository/` | `GameRepositoryTest`, `ScoreEntryRepositoryTest`, `SessionRepositoryTest` |
| Tests Other | `tests/` | `Dto/DtoMappingTest`, `Doctrine/CompletedGamesExtensionTest` |
| Migration | `migrations/` | Single file (regenerated from scratch) |

## Frontend (`frontend/src/`)

| Category | Path | Files |
|---|---|---|
| Entry | `App.tsx` | Routes, ThemeProvider (`next-themes`, `attribute="class"`), ThemedToaster (sonner), ErrorBoundary (react-error-boundary). Modal/Select use `@headlessui/react` |
| Query client | `queryClient.ts` | QueryClient singleton (staleTime: 30s) |
| Pages | `pages/` | `Home`, `SessionPage`, `SessionSummary`, `Stats`, `PlayerStats`, `HeadToHead`, `Players`, `Groups`, `GroupDetail`, `Help`, `NotFound` |
| Components | `components/` | `ThemeSplash`, `ErrorFallback`, `NewGameModal`, `CompleteGameModal`, `DeleteGameModal`, `AddStarModal`, `BadgeUnlockedModal`, `BadgeEmoji`, `BadgeGrid`, `ChangeDealerModal`, `ChangeGroupModal`, `DateRangeFilter`, `GameDetailModal`, `ReorderPlayersModal`, `ShareQrCodeModal`, `SwapPlayersModal`, `Scoreboard`, `GameList`, `SessionList`, `PlayerSelector`, `GroupFilter`, `SessionGroupSelector`, `InProgressBanner`, `Layout`, `BottomNav`, `MemeOverlay`, `Leaderboard`, `EloRanking`, `EloEvolutionChart`, `GlobalEloEvolutionChart`, `ScoreEvolutionChart`, `ScoreTrendChart`, `ContractDistributionChart`, `ContractSuccessRateTable`, `PersonalRecords`, `RoleDistributionChart` |
| UI primitives | `components/ui/` | `ContractBadge`, `EmptyState`, `FAB`, `MetricCard`, `Modal`, `OverflowMenu`, `Pagination` (LoadMoreButton), `PlayerAvatar`, `ScoreDisplay`, `SearchInput`, `Select`, `Spinner`, `Stepper`, `UndoFAB` + `index.ts` barrel |
| Hooks (queries) | `hooks/` | `useGame`, `useHeadToHead`, `usePlayers`, `useSession`, `useSessionSummary`, `useSessions`, `useSessionGames`, `useAllSessionGames`, `useGlobalStats`, `usePlayerStats`, `usePlayerGroup`, `usePlayerGroups` |
| Hooks (mutations) | `hooks/` | `useCreatePlayer`, `useCreateSession`, `useCreateGame`, `useCompleteGame`, `useCloseSession`, `useCloseGroupSessions`, `useDeleteGame`, `useAddStar`, `useAwardKonamiBadge`, `useReorderPlayers`, `useUpdateDealer`, `useUpdatePlayer`, `useCreatePlayerGroup`, `useUpdatePlayerGroup`, `useDeletePlayerGroup`, `useUpdateSessionGroup` |
| Hooks (other) | `hooks/` | `useCheatCode`, `useDebounce`, `useGameEventListener`, `useKonamiCode`, `usePinchZoom`, `useResetOnOpen`, `useShake`, `useTextNormalizer`, `useThemeSounds`, `useVoiceScoring` |
| Types | `types/` | `api.ts` (all TS interfaces), `enums.ts` (const-enums mirroring PHP) |
| Utils | `utils/` | `playerOrder.ts` (`sortPlayersByOrder`) |
| Services | `services/` | `api.ts` (`apiFetch<T>`, `ApiError`), `scoreCalculator.ts`, `themeRegistry.ts` (`CUSTOM_THEMES`, `getThemeConfig`), `gameEvents.ts` (mitt), `voiceScoreParser.ts`, `memeSelector.ts` |
| Tests | `__tests__/` | Mirror structure. Mocks: `__tests__/mocks/recharts.tsx` |

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/aide` | Help |
| `/groups` | Groups |
| `/groups/:id` | GroupDetail |
| `/players` | Players |
| `/sessions/:id` | SessionPage |
| `/sessions/:id/summary` | SessionSummary |
| `/stats` | Stats |
| `/stats/h2h` | HeadToHead |
| `/stats/player/:id` | PlayerStats |
| `*` | NotFound |

## API Endpoints

| Resource | Endpoints |
|---|---|
| Player | `GET/POST /players`, `GET/PATCH /players/{id}` |
| Session | `GET/POST /sessions`, `GET/PATCH /sessions/{id}` |
| Game | `POST /sessions/{id}/games`, `PATCH/DELETE /games/{id}` |
| StarEvent | `POST /sessions/{id}/star_events` |
| PlayerGroup | `GET/POST /player_groups`, `GET/PATCH/DELETE /player_groups/{id}` |
| Session Summary | `GET /api/sessions/{id}/summary` |
| Group Close | `POST /api/player-groups/{id}/close-sessions` |
| Statistics | `GET /api/statistics` (global), `GET /api/statistics/head-to-head`, `GET /api/statistics/players/{id}` |
| Konami | `POST /api/players/{id}/konami` |

## Implementation Patterns

### New Backend Entity

1. `src/Entity/X.php`: `#[ApiResource]` + operations + groups, `#[ORM\Entity]`, auto-increment ID, `#[Groups]`/`#[Assert]`, alphabetical order. `'skip_null_values' => false` if nullable fields needed in response.
2. `make db-diff` → `make db-migrate`
3. Custom logic → State processor: `final readonly class XProcessor implements ProcessorInterface`, inject `PersistProcessor`/`RemoveProcessor`. Sub-resource POST: `read: false`.
4. Tests: extend `ApiTestCase` in `tests/Api/`

### New Backend Validator

1. Constraint class `src/Validator/MyConstraint.php` (extends `Constraint`)
2. Validator class `src/Validator/MyConstraintValidator.php` (extends `ConstraintValidator`)
3. Apply `#[MyConstraint]` on entity

### New Frontend Hook (Query)

```typescript
// hooks/useXxx.ts
export function useXxx() {
  return useQuery({
    queryFn: () => apiFetch<HydraCollection<Xxx>>("/xxx"),
    queryKey: ["xxx"],
    select: (data) => data.member,
  });
}
```

### New Frontend Hook (Mutation)

```typescript
// hooks/useCreateXxx.ts
export function useCreateXxx() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Payload) =>
      apiFetch<Xxx>("/xxx", { body: JSON.stringify(payload), method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["xxx"] }),
  });
}
```

PATCH: `method: "PATCH"`, headers `{ "Content-Type": "application/merge-patch+json" }`. DELETE: `method: "DELETE"` (204, empty body handled).

### New Page

1. `pages/MyPage.tsx` → 2. Route in `App.tsx` → 3. Nav link in `BottomNav.tsx` if needed

### Frontend Tests

- `@testing-library/react` + vitest, wrap with `QueryClientProvider`
- Mock `apiFetch` via `vi.mock` (use `importOriginal` to keep `ApiError` real)
- `vi.clearAllMocks()` in `afterEach`. Duplicate text → `getAllByText()[index]`. Mutation errors need `waitFor`.

### Backend Tests

- Extend `ApiTestCase`: helpers `createPlayer()`, `createSessionWithPlayers()`, `createPlayerGroup()`, `getIri()`
- `$client->disableReboot()` for multi-request. dama/doctrine-test-bundle for isolation. PHPUnit 12: `#[DataProvider]`

## Conventions

- INT auto-increment IDs. API Platform 4: `member`/`totalItems` (no `hydra:` prefix)
- Serialization groups control embedded vs IRI. Custom routes via `config/routes/controllers.yaml`
- Rector: `make rector` / `make rector-dry`. Config: `backend/rector.php`
- Tailwind 4 + dark mode (`dark:` variants, `next-themes` `attribute="class"`) + custom themes via `themeRegistry.ts` (doom: `doom:` variant, `.doom` class)
- Charts: Recharts
