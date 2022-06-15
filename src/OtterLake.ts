import { Term } from '../generated/schema'
import { TermAdded, TermUpdated, TermRemoved, TermDisabled } from '../generated/OtterTreasury/OtterLake';
import { store } from '@graphprotocol/graph-ts';

enum TERM_SETTING {
  MIN_LOCK_AMOUNT = 1,
  LOCK_PERIOD = 2,
}

export function handleTermAdded(event: TermAdded) {
  const term = new Term(event.params.note.toHex());
  term.enabled = true;
  term.note = event.params.note;
  term.minLockAmount = event.params.minLockAmount;
  term.lockPeriod = event.params.lockPeriod;
  term.multiplier = event.params.multiplier;
  term.save();
}

export function handleTermUpdated(event: TermUpdated) {
  const term = Term.load(event.params.note.toHex())
  if (!term) {
    return;
  }

  if (event.params.setting === TERM_SETTING.LOCK_PERIOD) {
    term.lockPeriod = event.params.value;
  } else if (event.params.setting === TERM_SETTING.MIN_LOCK_AMOUNT) {
    term.minLockAmount = event.params.value;
  } else {
    return;
  }

  term.save();
}

export function handleTermRemoved(event: TermRemoved) {
  store.remove('Term', event.params.note.toHex());
}

export function handleTermDisabled(event: TermDisabled) {
  const term = Term.load(event.params.note.toHex())
  if (!term) {
    return;
  }

  term.enabled = false;
  term.save();
}