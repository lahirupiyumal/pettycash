const PettyCashRecord = require('../models/PettyCashRecord');

const getServiceNumberCandidates = (serviceNumber) => {
  const raw = String(serviceNumber || '').trim();
  if (!raw) return { numeric: [], string: [] };

  const numericValue = Number.parseInt(raw, 10);
  const numeric = Number.isNaN(numericValue) ? [] : [numericValue];
  const string = [raw];

  if (!Number.isNaN(numericValue)) {
    string.push(String(numericValue));
    string.push(String(numericValue).padStart(raw.length, '0'));
  }

  return {
    numeric: [...new Set(numeric)],
    string: [...new Set(string)],
  };
};

const findReportingAccountantMatch = async (serviceNumber) => {
  const candidates = getServiceNumberCandidates(serviceNumber);
  if (!candidates.numeric.length && !candidates.string.length) return null;

  return PettyCashRecord.findOne({
    $or: [
      { 'reportingAccountant.empNumber': { $in: candidates.numeric } },
      {
        $expr: {
          $in: [
            { $toString: '$reportingAccountant.empNumber' },
            candidates.string,
          ],
        },
      },
    ],
  })
    .select('region pcfRef reportingAccountant')
    .lean();
};

const autoApproveReportingAccountant = async (user) => {
  if (!user?.serviceNumber || user.role !== 'accountant' || user.status === 'rejected') {
    return { user, approved: false, match: null };
  }

  const match = await findReportingAccountantMatch(user.serviceNumber);
  if (!match) return { user, approved: false, match: null };

  let changed = false;
  if (user.status !== 'approved') {
    user.status = 'approved';
    changed = true;
  }
  if (!user.isApproved) {
    user.isApproved = true;
    changed = true;
  }
  if (!user.roleSelected) {
    user.roleSelected = true;
    changed = true;
  }

  if (changed) {
    await user.save();
  }

  return { user, approved: changed, match };
};

module.exports = {
  autoApproveReportingAccountant,
  findReportingAccountantMatch,
};
