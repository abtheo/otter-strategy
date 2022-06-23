import { Term, NoteToken } from '../generated/schema'
import { TermAdded, TermUpdated, TermRemoved, TermDisabled, Locked, Redeemed } from '../generated/OtterLake/OtterLake';
import { store } from '@graphprotocol/graph-ts';

enum TERM_SETTING {
  MIN_LOCK_AMOUNT = 1,
  LOCK_PERIOD = 2,
}

const getNoteTokenIdFromEvent = (event: Locked | Redeemed) => ['NoteToken', event.params.tokenId.toHex()].join('_')

const getTermIdFromEvent = (event: TermAdded | TermUpdated | TermRemoved | TermDisabled) => ['Term', event.params.note.toHex()].join('_')

export function handleTermAdded(event: TermAdded): void {
  const term = new Term(getTermIdFromEvent(event));
  term.enabled = true;
  term.note = event.params.note;
  term.minLockAmount = event.params.minLockAmount;
  term.lockPeriod = event.params.lockPeriod;
  term.multiplier = event.params.multiplier;
  term.save();
}

export function handleTermUpdated(event: TermUpdated): void {
  const term = Term.load(getTermIdFromEvent(event))
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

export function handleTermRemoved(event: TermRemoved): void {
  store.remove('Term', getTermIdFromEvent(event));
}

export function handleTermDisabled(event: TermDisabled): void {
  const term = Term.load(getTermIdFromEvent(event))
  if (!term) {
    return;
  }

  term.enabled = false;
  term.save();
}

export function handleLocked(event: Locked): void {
  const id = getNoteTokenIdFromEvent(event);
  let token = (NoteToken.load(id) || new NoteToken(id)) as NoteToken;
  token.tokenId = event.params.tokenId;
  token.note = event.params.note;
  token.amount = event.params.amount;
  token.user = event.params.user;
  token.updatedAt = event.block.timestamp;
  token.save();
}

export function handleRedeemed(event: Redeemed): void {
  store.remove('NoteToken', getNoteTokenIdFromEvent(event));
}