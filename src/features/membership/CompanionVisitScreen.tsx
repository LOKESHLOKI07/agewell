import { CarePersonVisitScreen } from './CarePersonVisitScreen';
import { MOCK_COMPANION } from './mockStaff';

export function CompanionVisitScreen() {
  return (
    <CarePersonVisitScreen
      title="Companion Visit"
      person={MOCK_COMPANION}
      slug="companion"
      videoHint="Your companion visits daily for assistance or company — usually up to 30 minutes depending on need."
    />
  );
}
