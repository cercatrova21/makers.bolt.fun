const {
    intArg,
    objectType,
    stringArg,
    extendType,
    nonNull,
    enumType,
} = require('nexus');
const { prisma } = require('../../../prisma');
const { paginationArgs } = require('./helpers');



const TournamentPrize = objectType({
    name: 'TournamentPrize',
    definition(t) {
        t.nonNull.string('title');
        t.nonNull.string('amount');
        t.nonNull.string('image');
    }
})

const TournamentJudge = objectType({
    name: 'TournamentJudge',
    definition(t) {
        t.nonNull.string('name');
        t.nonNull.string('jobTitle');
        t.nonNull.string('avatar');
    }
})

const TournamentFAQ = objectType({
    name: 'TournamentFAQ',
    definition(t) {
        t.nonNull.string('question');
        t.nonNull.string('answer');
    }
})



const TournamentEventTypeEnum = enumType({
    name: 'TournamentEventTypeEnum',
    members: {
        TwitterSpace: 0,
        Workshop: 1,
        IRLMeetup: 2,
        OnlineMeetup: 3,
    },
});


const TournamentEvent = objectType({
    name: 'TournamentEvent',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('title');
        t.nonNull.string('image');
        t.nonNull.string('description');
        t.nonNull.date('date');
        t.nonNull.string('location');
        t.nonNull.string('website');
        t.nonNull.field('type', { type: TournamentEventTypeEnum })
        t.nonNull.list.nonNull.string('links');
    }
})

const Tournament = objectType({
    name: 'Tournament',
    definition(t) {
        t.nonNull.int('id');
        t.nonNull.string('title');
        t.nonNull.string('description');
        t.nonNull.string('thumbnail_image');
        t.nonNull.string('cover_image');
        t.nonNull.date('start_date');
        t.nonNull.date('end_date');
        t.nonNull.string('location');
        t.nonNull.string('website');

        t.nonNull.int('events_count');
        t.nonNull.int('makers_count', {
            resolve(parent) {
                return prisma.user.count();
            }
        });
        t.nonNull.int('projects_count');

        t.nonNull.list.nonNull.field('prizes', { type: TournamentPrize, });
        t.nonNull.list.nonNull.field('judges', { type: TournamentJudge, });
        t.nonNull.list.nonNull.field('faqs', { type: TournamentFAQ, });
        t.nonNull.list.nonNull.field('events', { type: TournamentEvent, });
    }
})


const TournamentMakersResponse = objectType({
    name: 'TournamentMakersResponse',
    definition(t) {
        t.boolean('hasNext');
        t.boolean('hasPrev');

        t.nonNull.list.nonNull.field('makers', { type: "User" })
    }
}
)

const TournamentProjectsResponse = objectType({
    name: 'TournamentProjectsResponse',
    definition(t) {
        t.boolean('hasNext');
        t.boolean('hasPrev');

        t.nonNull.list.nonNull.field('projects', { type: "Project" })
    }
}
)

const getTournamentById = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field('getTournamentById', {
            type: Tournament,
            args: {
                id: nonNull(intArg()),
            },
            resolve(_, { id }) {
                return null
            }
        })
    }
})



const getMakersInTournament = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field('getMakersInTournament', {
            type: TournamentMakersResponse,
            args: {
                tournamentId: nonNull(intArg()),
                ...paginationArgs({ take: 10 }),
                search: stringArg(),
                roleId: intArg(),
            },
            async resolve(_, args) {


                let filters = [];

                if (args.search) filters.push({
                    OR: [
                        {
                            name: {
                                contains: args.search,
                                mode: 'insensitive'
                            }
                        },
                        {
                            jobTitle: {
                                contains: args.search,
                                mode: 'insensitive'
                            }
                        }
                    ]
                })


                if (args.roleId) filters.push({
                    roles: {
                        some: {
                            roleId: args.roleId
                        }
                    }
                })


                const makers = await prisma.user.findMany({
                    ...(filters.length > 0 && {
                        where: {
                            AND: filters
                        }
                    }),
                    skip: args.skip,
                    take: args.take + 1,
                });

                return {
                    hasNext: makers.length === args.take + 1,
                    hasPrev: args.skip !== 0,
                    makers: makers.slice(0, args.take)
                }
            }
        })
    }
})

const getProjectsInTournament = extendType({
    type: "Query",
    definition(t) {
        t.nonNull.field('getProjectsInTournament', {
            type: TournamentProjectsResponse,
            args: {
                tournamentId: nonNull(intArg()),
                ...paginationArgs({ take: 10 }),
                search: stringArg(),
                roleId: intArg(),
            },
            async resolve(_, args) {


                let filters = [];

                if (args.search) filters.push({
                    OR: [
                        {
                            title: {
                                contains: args.search,
                                mode: 'insensitive'
                            }
                        },
                        {
                            description: {
                                contains: args.search,
                                mode: 'insensitive'
                            }
                        }
                    ]
                })


                // if (args.roleId) filters.push({
                //     roles: {
                //         some: {
                //             roleId: args.roleId
                //         }
                //     }
                // })


                const makers = await prisma.project.findMany({
                    ...(filters.length > 0 && {
                        where: {
                            AND: filters
                        }
                    }),
                    skip: args.skip,
                    take: args.take + 1,
                });

                return {
                    hasNext: makers.length === args.take + 1,
                    hasPrev: args.skip !== 0,
                    makers: makers.slice(0, args.take)
                }
            }
        })
    }
})

module.exports = {
    // Types 
    Tournament,
    // Queries
    getTournamentById,
    getMakersInTournament,
}