import Breast from './breast.json';
import CardiovascularSystem from './cardiovascular-system.json';
import CentralNervousSystem from './central-nervous-system.json';
import Eye from './eye.json';
import FemaleGenitalTract from './female-genital-tract.json';
import GastrointestinalTract from './gastrointestinal-tract.json';
import HaematolymphoidSystem from './haematolymphoid-system.json';
import HepatobiliarySystemandPancreas from './hepatobiliary-system-and-pancreas.json';
import MusculoskeletalSystem from './musculoskeletal-system.json';
import RespiratoryTract from './respiratory-tract.json';
import Skin from './skin.json';
import ThyroidandEndocrineSystem from './thyroid-and-endocrine-system.json';
import UrogenitalSystemandMaleReproductiveSystem from './urogenital-system-and-male-reproductive-system.json';

const slides = [
  ...Breast,
  ...CardiovascularSystem,
  ...CentralNervousSystem,
  ...Eye,
  ...FemaleGenitalTract,
  ...GastrointestinalTract,
  ...HaematolymphoidSystem,
  ...HepatobiliarySystemandPancreas,
  ...MusculoskeletalSystem,
  ...RespiratoryTract,
  ...Skin,
  ...ThyroidandEndocrineSystem,
  ...UrogenitalSystemandMaleReproductiveSystem
];

export default slides;